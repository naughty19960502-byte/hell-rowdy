#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"
#include "HellRowdyLookAndFeel.h"

//==============================================================================
// Piano roll preview -- shows a few hardcoded blue MIDI note blocks
//==============================================================================
class PianoRollView : public juce::Component
{
public:
    PianoRollView() { setInterceptsMouseClicks (false, false); }

    void paint (juce::Graphics& g) override
    {
        auto b = getLocalBounds().toFloat();

        // Background
        g.fillAll (juce::Colour (0xff0d1117));

        // Horizontal grid lines (12 rows = one octave)
        const int numRows = 12;
        const float rowH  = b.getHeight() / (float) numRows;
        g.setColour (juce::Colour (0xff1e2533));
        for (int i = 1; i < numRows; ++i)
            g.drawHorizontalLine (juce::roundToInt (i * rowH), b.getX(), b.getRight());

        // Vertical bar lines
        g.setColour (juce::Colour (0xff1a2030));
        for (int bar = 1; bar < 4; ++bar)
            g.drawVerticalLine (juce::roundToInt (b.getWidth() * bar / 4.f),
                                b.getY(), b.getBottom());

        // Hardcoded sample notes (x, y, w, h -- all relative 0..1)
        struct NoteRect { float x, y, w, h; };
        static const NoteRect notes[] = {
            { 0.02f, 0.25f, 0.10f, 0.07f },
            { 0.15f, 0.50f, 0.08f, 0.07f },
            { 0.26f, 0.17f, 0.12f, 0.07f },
            { 0.42f, 0.42f, 0.09f, 0.07f },
            { 0.55f, 0.58f, 0.13f, 0.07f },
            { 0.71f, 0.33f, 0.10f, 0.07f },
            { 0.84f, 0.67f, 0.14f, 0.07f },
        };

        g.setColour (juce::Colour (0xff4a9eff));
        for (auto& n : notes)
        {
            g.fillRoundedRectangle (n.x * b.getWidth(),
                                    n.y * b.getHeight(),
                                    n.w * b.getWidth(),
                                    n.h * b.getHeight(),
                                    1.5f);
        }

        // Border
        g.setColour (juce::Colour (0xff2a3a50));
        g.drawRect (b, 1.f);
    }
};

//==============================================================================
// Preset list model
//==============================================================================
class PresetListModel : public juce::ListBoxModel
{
public:
    static const juce::StringArray& items()
    {
        static const juce::StringArray s {
            "ORCHESTRA", "SYNTH", "TEXTURE", "SEAITING",
            "GRAIN", "ROUNDS", "DELVERY", "PRESETS",
            "BLOTS", "LEX"
        };
        return s;
    }

    int getNumRows() override { return items().size(); }

    void paintListBoxItem (int row, juce::Graphics& g,
                           int width, int height,
                           bool isSelected) override
    {
        if (isSelected)
        {
            g.setColour (juce::Colour (0xff2a1a00));
            g.fillRect (0, 0, width, height);
        }

        g.setFont (juce::Font (11.f, juce::Font::bold));
        g.setColour (isSelected ? juce::Colour (0xffffaa00)
                                : juce::Colour (0xffff8c00));
        g.drawFittedText (items()[row], 10, 0, width - 14, height,
                          juce::Justification::centredLeft, 1);
    }
};

//==============================================================================
// Main editor
//==============================================================================
class HellRowdyEditor : public juce::AudioProcessorEditor
{
public:
    explicit HellRowdyEditor (HellRowdyProcessor&);
    ~HellRowdyEditor() override;

    void paint   (juce::Graphics&) override;
    void resized () override;

private:
    HellRowdyProcessor& processor;

    HellRowdyLookAndFeel laf;

    // Left panel
    PresetListModel  presetModel;
    juce::ListBox    presetList;

    // Right panel -- knobs
    juce::Slider buckSlider    { juce::Slider::RotaryVerticalDrag, juce::Slider::NoTextBox };
    juce::Slider darknessSlider{ juce::Slider::RotaryVerticalDrag, juce::Slider::NoTextBox };
    juce::Slider hollowSlider  { juce::Slider::RotaryVerticalDrag, juce::Slider::NoTextBox };

    juce::Label buckLabel, darknessLabel, hollowLabel;

    juce::AudioProcessorValueTreeState::SliderAttachment buckAttach, darknessAttach, hollowAttach;

    // Bottom row
    juce::TextButton generateButton { "GENERATE MIDI" };
    PianoRollView    pianoRoll;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HellRowdyEditor)
};
