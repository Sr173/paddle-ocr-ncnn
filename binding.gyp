{
  "targets": [
    {
      "target_name": "paddle_ocr_ncnn",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags_cc": ["-std=c++17", "-fPIC"],
      "sources": [
        "src/binding.cpp",
        "src/db_net.cpp",
        "src/angle_net.cpp",
        "src/crnn_net.cpp",
        "src/ocr_engine.cpp",
        "src/utils.cpp",
        "src/3rdparty/clipper2/clipper.engine.cpp",
        "src/3rdparty/clipper2/clipper.offset.cpp",
        "src/3rdparty/clipper2/clipper.rectclip.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src",
        "src/3rdparty"
      ],
      "defines": [
        "NAPI_VERSION=8",
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "11.0",
            "OTHER_CFLAGS": [
              "-Wno-unused-parameter",
              "-Wno-sign-compare"
            ],
            "OTHER_LDFLAGS": [
              "-F<(module_root_dir)/deps",
              "-framework ncnn",
              "-framework openmp",
              "-framework glslang",
              "-framework Metal",
              "-framework Foundation",
              "-framework CoreGraphics",
              "-framework QuartzCore",
              "-L<!(brew --prefix molten-vk)/lib",
              "-lMoltenVK",
              "-Wl,-rpath,@loader_path/../deps",
              "-Wl,-rpath,<(module_root_dir)/deps",
              "-Wl,-rpath,<!(brew --prefix molten-vk)/lib"
            ]
          },
          "include_dirs": [
            "deps/ncnn.framework/Headers/ncnn",
            "deps/openmp.framework/Headers",
            "<!(brew --prefix opencv 2>/dev/null || echo /usr/local)/include/opencv4"
          ],
          "libraries": [
            "-L<!(brew --prefix opencv 2>/dev/null || echo /usr/local)/lib",
            "-lopencv_core",
            "-lopencv_imgproc",
            "-lopencv_imgcodecs",
            "-framework Accelerate",
            "-framework CoreML",
            "-framework Metal",
            "-framework MetalKit"
          ]
        }],
        ["OS=='linux'", {
          "cflags_cc": [
            "-std=c++17",
            "-fPIC",
            "-Wno-unused-parameter",
            "-Wno-sign-compare"
          ],
          "include_dirs": [
            "<!(echo ${NCNN_DIR:-deps/ncnn})/include/ncnn",
            "<!(pkg-config --cflags-only-I opencv4 2>/dev/null | sed 's/-I//g' || echo /usr/include/opencv4)"
          ],
          "libraries": [
            "-L<!(echo ${NCNN_DIR:-deps/ncnn})/lib",
            "-lncnn",
            "<!(pkg-config --libs opencv4 2>/dev/null || echo '-lopencv_core -lopencv_imgproc -lopencv_imgcodecs')",
            "-lpthread",
            "-lgomp"
          ],
          "ldflags": [
            "-Wl,-rpath,<!(echo ${NCNN_DIR:-deps/ncnn})/lib"
          ]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": ["/std:c++17", "/MD"]
            },
            "VCLinkerTool": {
              "AdditionalDependencies": ["ucrt.lib"]
            }
          },
          "defines": [
            "_WIN32",
            "NOMINMAX"
          ],
          "include_dirs": [
            "deps/ncnn/x64/include/ncnn",
            "deps/opencv/build/include"
          ],
          "libraries": [
            "<(module_root_dir)/deps/ncnn/x64/lib/ncnn.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/glslang.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/SPIRV.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/MachineIndependent.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/GenericCodeGen.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/OGLCompiler.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/OSDependent.lib",
            "<(module_root_dir)/deps/ncnn/x64/lib/glslang-default-resource-limits.lib",
            "<(module_root_dir)/deps/opencv/build/x64/vc16/lib/opencv_world4120.lib"
          ],
          "copies": [{
            "destination": "<(module_root_dir)/build/Release",
            "files": [
              "<(module_root_dir)/deps/opencv/build/x64/vc16/bin/opencv_world4120.dll"
            ]
          }]
        }]
      ]
    }
  ]
}
