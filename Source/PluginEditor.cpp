#include "PluginEditor.h"

//==============================================================================
HellRowdyEditor::HellRowdyEditor (HellRowdyProcessor& p)
    : AudioProcessorEditor (&p),
      processor (p),
      buckAttach     (p.apvts, "buck",     buckSlider),
      darknessAttach (p.apvts, "darkness", darknessSlider),
      hollowAttach   (p.apvts, "hollow",   hollowSlider)
{
    setSize (640, 400);
    setLookAndFeel (&laf);

    //-- Left panel: preset list -------------------------------------------
    presetList.setModel (&presetModel);
    presetList.setColour (juce::ListBox::backgroundColourId,   juce::Colour (0xff141414));
    presetList.setColour (juce::ListBox::outlineColourId,      juce::Colour (0xff2a1a00));
    presetList.setOutlineThickness (1);
    presetList.setRowHeight (24);
    addAndMakeVisible (presetList);

    //-- Knobs -------------------------------------------------------------
    auto setupSlider = [&] (juce::Slider& s)
    {
        s.setSliderStyle (juce::Slider::RotaryVerticalDrag);
        s.setTextBoxStyle (juce::Slider::NoTextBox, false, 0, 0);
        addAndMakeVisible (s);
    };
    setupSlider (buckSlider);
    setupSlider (darknessSlider);
    setupSlider (hollowSlider);

    auto setupLabel = [&] (juce::Label& l, const juce::String& text)
    {
        l.setText (text, juce::dontSendNotification);
        l.setFont (juce::Font (11.f, juce::Font::bold));
        l.setColour (juce::Label::textColourId, juce::Colour (0xffff8c00));
        l.setJustificationType (juce::Justification::centred);
        addAndMakeVisible (l);
    };
    setupLabel (buckLabel,     "BUCK");
    setupLabel (darknessLabel, "DARKNESS");
    setupLabel (hollowLabel,   "HOLLOW");

    //-- Generate button ---------------------------------------------------
    generateButton.onClick = [this]
    {
        processor.generateMidi.store (true);
    };
    addAndMakeVisible (generateButton);

    //-- Piano roll --------------------------------------------------------
    addAndMakeVisible (pianoRoll);
}

HellRowdyEditor::~HellRowdyEditor()
{
    setLookAndFeel (nullptr);
}

//==============================================================================
void HellRowdyEditor::paint (juce::Graphics& g)
{
    // Distressed metal background
    laf.paintDistressedBackground (g, *this);

    // Left panel backdrop
    g.setColour (juce::Colour (0xff141414));
    g.fillRect (0, 20, 160, getHeight() - 20);

    // Left panel right-edge accent line
    g.setColour (juce::Colour (0xff2a1a00));
    g.drawVerticalLine (160, 20, getHeight());

    // Title bar gradient
    g.setGradientFill (juce::ColourGradient (
        juce::Colour (0xff1a1008), 0.f,  0.f,
        juce::Colour (0xff0a0800), 0.f, 20.f, false));
    g.fillRect (0, 0, getWidth(), 20);

    // Title: "HELL ROWDY"
    g.setFont (juce::Font (16.f, juce::Font::bold));
    g.setColour (juce::Colour (0xffff8c00));
    g.drawText ("HELL ROWDY", 6, 2, 200, 16, juce::Justification::centredLeft, false);

    // Version tag
    g.setFont (juce::Font (9.f));
    g.setColour (juce::Colour (0xff664400));
    g.drawText ("GhostTape", getWidth() - 70, 4, 65, 12,
                juce::Justification::centredRight, false);

    // Knob labels background strip (right panel top)
    {
        juce::Rectangle<int> strip (160, 20, getWidth() - 160, 20);
        g.setColour (juce::Colour (0x22ff8c00));
        g.fillRect (strip);
        g.setColour (juce::Colour (0x44ff8c00));
        g.drawHorizontalLine (strip.getBottom(), 160.f, (float) getWidth());
    }

    // Bottom section separator
    g.setColour (juce::Colour (0xff2a1a00));
    g.drawHorizontalLine (getHeight() - 110, 161.f, (float) getWidth());
}

//==============================================================================
void HellRowdyEditor::resized()
{
    const int titleH   = 20;
    const int leftW    = 160;
    const int bottomH  = 110;

    const int rightX   = leftW;
    const int rightW   = getWidth() - leftW;
    const int rightH   = getHeight() - titleH - bottomH;

    // Left: preset list (full height under title)
    presetList.setBounds (0, titleH, leftW, getHeight() - titleH);

    // Right top: 3 knobs in equal columns
    const int labelH = 20;
    const int knobH  = rightH - labelH;
    const int colW   = rightW / 3;

    // Labels (above knobs)
    buckLabel    .setBounds (rightX,            titleH, colW, labelH);
    darknessLabel.setBounds (rightX + colW,     titleH, colW, labelH);
    hollowLabel  .setBounds (rightX + colW * 2, titleH, colW, labelH);

    // Knobs (padded within each column)
    const int knobPad = 8;
    auto knobBounds = [&] (int col) -> juce::Rectangle<int>
    {
        return { rightX + col * colW + knobPad,
                 titleH + labelH + knobPad,
                 colW - knobPad * 2,
                 knobH - knobPad * 2 };
    };
    buckSlider    .setBounds (knobBounds (0));
    darknessSlider.setBounds (knobBounds (1));
    hollowSlider  .setBounds (knobBounds (2));

    // Bottom section layout
    const int bottomY  = getHeight() - bottomH;
    const int btnW     = 200;
    const int btnH     = 40;
    const int btnY     = bottomY + (bottomH - btnH) / 2;
    const int btnX     = rightX + 16;

    generateButton.setBounds (btnX, btnY, btnW, btnH);

    // Piano roll to the right of the button
    const int rollX = btnX + btnW + 16;
    const int rollW = getWidth() - rollX - 16;
    const int rollH = 72;
    const int rollY = bottomY + (bottomH - rollH) / 2;
    pianoRoll.setBounds (rollX, rollY, rollW, rollH);
}
