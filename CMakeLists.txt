cmake_minimum_required(VERSION 3.22)
project(HellRowdy VERSION 1.0.0)

# JUCEをFetchContentで取得（サブモジュール不要）
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.9
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(HellRowdy
    COMPANY_NAME            "GhostTape"
    COMPANY_WEBSITE         "https://ghosttape.dev"
    PLUGIN_MANUFACTURER_CODE Gtpe
    PLUGIN_CODE             HlRw
    FORMATS                 VST3 AU Standalone
    PRODUCT_NAME            "Hell Rowdy"
    IS_SYNTH                TRUE
    NEEDS_MIDI_INPUT        FALSE
    NEEDS_MIDI_OUTPUT       TRUE
    IS_MIDI_EFFECT          FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    VST3_CATEGORIES         "Instrument|Generator"
    AU_MAIN_TYPE            kAudioUnitType_MusicDevice
    COPY_PLUGIN_AFTER_BUILD FALSE
)
juce_generate_juce_header(HellRowdy)
target_sources(HellRowdy PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginEditor.cpp
)

target_include_directories(HellRowdy PRIVATE Source)

target_compile_definitions(HellRowdy PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(HellRowdy PRIVATE
    juce::juce_audio_utils
    juce::juce_gui_basics
    juce::juce_audio_processors
    PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags
)
