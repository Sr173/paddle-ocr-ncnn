#include <napi.h>
#include <opencv2/opencv.hpp>
#include <string>
#include <vector>
#include <memory>

#include "ocr_engine.h"

class OCREngineWrapper : public Napi::ObjectWrap<OCREngineWrapper>
{
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    OCREngineWrapper(const Napi::CallbackInfo &info);

private:
    std::unique_ptr<OCR::OCREngine> engine_;

    Napi::Value Initialize(const Napi::CallbackInfo &info);
    Napi::Value Detect(const Napi::CallbackInfo &info);
    Napi::Value DetectBuffer(const Napi::CallbackInfo &info);

    // Helper to convert OCRResult to JS object
    static Napi::Object ResultToObject(Napi::Env env, const OCR::OCRResult &result);
};

Napi::Object OCREngineWrapper::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "OCREngine", {
        InstanceMethod("initialize", &OCREngineWrapper::Initialize),
        InstanceMethod("detect", &OCREngineWrapper::Detect),
        InstanceMethod("detectBuffer", &OCREngineWrapper::DetectBuffer),
    });

    Napi::FunctionReference *constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("OCREngine", func);
    return exports;
}

OCREngineWrapper::OCREngineWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<OCREngineWrapper>(info)
{
    engine_ = std::make_unique<OCR::OCREngine>();
}

Napi::Value OCREngineWrapper::Initialize(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString())
    {
        Napi::TypeError::New(env, "Config path (string) expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string config_path = info[0].As<Napi::String>().Utf8Value();
    bool success = engine_->Initialize(config_path);

    return Napi::Boolean::New(env, success);
}

Napi::Value OCREngineWrapper::Detect(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString())
    {
        Napi::TypeError::New(env, "Image path (string) expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string image_path = info[0].As<Napi::String>().Utf8Value();
    cv::Mat image = cv::imread(image_path);

    if (image.empty())
    {
        Napi::Error::New(env, "Failed to read image: " + image_path).ThrowAsJavaScriptException();
        return env.Null();
    }

    auto results = engine_->Run(image);

    Napi::Array result_array = Napi::Array::New(env, results.size());
    for (size_t i = 0; i < results.size(); ++i)
    {
        result_array.Set(i, ResultToObject(env, results[i]));
    }

    return result_array;
}

Napi::Value OCREngineWrapper::DetectBuffer(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsBuffer())
    {
        Napi::TypeError::New(env, "Image buffer expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    std::vector<uint8_t> data(buffer.Data(), buffer.Data() + buffer.Length());

    cv::Mat image = cv::imdecode(data, cv::IMREAD_COLOR);

    if (image.empty())
    {
        Napi::Error::New(env, "Failed to decode image buffer").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto results = engine_->Run(image);

    Napi::Array result_array = Napi::Array::New(env, results.size());
    for (size_t i = 0; i < results.size(); ++i)
    {
        result_array.Set(i, ResultToObject(env, results[i]));
    }

    return result_array;
}

Napi::Object OCREngineWrapper::ResultToObject(Napi::Env env, const OCR::OCRResult &result)
{
    Napi::Object obj = Napi::Object::New(env);

    // Text content
    obj.Set("text", Napi::String::New(env, result.line.text));

    // Character scores
    Napi::Array scores = Napi::Array::New(env, result.line.scores.size());
    for (size_t i = 0; i < result.line.scores.size(); ++i)
    {
        scores.Set(i, Napi::Number::New(env, result.line.scores[i]));
    }
    obj.Set("charScores", scores);

    // Bounding box points
    Napi::Array box = Napi::Array::New(env, result.box.points.size());
    for (size_t i = 0; i < result.box.points.size(); ++i)
    {
        Napi::Object point = Napi::Object::New(env);
        point.Set("x", Napi::Number::New(env, result.box.points[i].x));
        point.Set("y", Napi::Number::New(env, result.box.points[i].y));
        box.Set(i, point);
    }
    obj.Set("box", box);
    obj.Set("boxScore", Napi::Number::New(env, result.box.score));

    // Angle info
    Napi::Object angle = Napi::Object::New(env);
    angle.Set("isRotated", Napi::Boolean::New(env, result.angle.is_rot));
    angle.Set("score", Napi::Number::New(env, result.angle.score));
    obj.Set("angle", angle);

    return obj;
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    return OCREngineWrapper::Init(env, exports);
}

NODE_API_MODULE(paddle_ocr_ncnn, Init)
