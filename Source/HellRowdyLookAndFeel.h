#pragma once

#include <JuceHeader.h>

//==============================================================================
// HellRowdyLookAndFeel
// Heavy iron knobs with orange LED arcs, gold-framed GENERATE MIDI button.
// Scratch lines are baked into a fixed array at construction time.
//==============================================================================
class HellRowdyLookAndFeel : public juce::LookAndFeel_V4
{
public:
    HellRowdyLookAndFeel()
    {
        // Pre-bake 40 scratch lines so paint() never calls RNG
        juce::Random rng (0xDEADBEEF);
        for (int i = 0; i < kNumScratch; ++i)
        {
            scratchY[i]     = rng.nextFloat();          // 0..1 relative
            scratchAlpha[i] = rng.nextFloat() * 0.08f;  // subtle
        }
    }

    //==========================================================================
    // Rotary slider: heavy iron knob + orange LED arc
    //==========================================================================
    void drawRotarySlider (juce::Graphics& g,
                           int x, int y, int width, int height,
                           float sliderPosProportional,
                           float rotaryStartAngle,
                           float rotaryEndAngle,
                           juce::Slider& /*slider*/) override
    {
        const float cx = x + width  * 0.5f;
        const float cy = y + height * 0.5f;
        const float radius = juce::jmin (width, height) * 0.5f - 4.f;

        // --- Outer shadow ring ---
        g.setColour (juce::Colour (0x661a1a1a));
        g.fillEllipse (cx - radius - 3.f, cy - radius - 3.f,
                       (radius + 3.f) * 2.f, (radius + 3.f) * 2.f);

        // --- Knob body: radial gradient #3a3a3a -> #111111 ---
        {
            juce::ColourGradient grad (juce::Colour (0xff3a3a3a), cx - radius * 0.3f, cy - radius * 0.3f,
                                       juce::Colour (0xff111111), cx + radius * 0.5f, cy + radius * 0.5f,
                                       true);
            grad.addColour (0.5, juce::Colour (0xff222222));
            g.setGradientFill (grad);
            g.fillEllipse (cx - radius, cy - radius, radius * 2.f, radius * 2.f);
        }

        // --- Metal texture: faint concentric rings ---
        for (int ring = 1; ring <= 5; ++ring)
        {
            float r = radius * (ring / 6.f);
            g.setColour (juce::Colours::white.withAlpha (0.04f));
            g.drawEllipse (cx - r, cy - r, r * 2.f, r * 2.f, 0.5f);
        }

        // --- 12 o'clock highlight ---
        g.setColour (juce::Colours::white.withAlpha (0.15f));
        g.fillEllipse (cx - radius * 0.18f, cy - radius * 0.72f,
                       radius * 0.36f, radius * 0.22f);

        // --- LED arc: glow pass (wide, dim) ---
        const float arcGap  = 4.f;
        const float arcR    = radius - arcGap;
        const float currentAngle = rotaryStartAngle
                                   + sliderPosProportional * (rotaryEndAngle - rotaryStartAngle);

        juce::Path glowArc;
        glowArc.addCentredArc (cx, cy, arcR, arcR, 0.f,
                               rotaryStartAngle, currentAngle, true);
        g.setColour (juce::Colour (0x40ff8c00));
        g.strokePath (glowArc, juce::PathStrokeType (6.f,
                      juce::PathStrokeType::curved,
                      juce::PathStrokeType::rounded));

        // --- LED arc: bright pass (narrow) ---
        g.setColour (juce::Colour (0xffff8c00));
        g.strokePath (glowArc, juce::PathStrokeType (3.f,
                      juce::PathStrokeType::curved,
                      juce::PathStrokeType::rounded));

        // --- Centre pointer dot ---
        const float dotR = radius * 0.12f;
        g.setColour (juce::Colour (0xffff8c00));
        float dotX = cx + (radius * 0.6f) * std::sin (currentAngle);
        float dotY = cy - (radius * 0.6f) * std::cos (currentAngle);
        g.fillEllipse (dotX - dotR, dotY - dotR, dotR * 2.f, dotR * 2.f);

        // --- Outer bezel edge ---
        g.setColour (juce::Colour (0xff0a0a0a));
        g.drawEllipse (cx - radius, cy - radius, radius * 2.f, radius * 2.f, 1.5f);
    }

    //==========================================================================
    // Button background: gold-framed dark button
    //==========================================================================
    void drawButtonBackground (juce::Graphics& g,
                               juce::Button& button,
                               const juce::Colour& /*backgroundColour*/,
                               bool isHighlighted,
                               bool isDown) override
    {
        auto bounds = button.getLocalBounds().toFloat().reduced (1.f);
        const float corner = 3.f;

        // Fill
        juce::Colour fill = isDown       ? juce::Colour (0xff2a2010)
                          : isHighlighted ? juce::Colour (0xff201a0a)
                                         : juce::Colour (0xff141410);
        g.setColour (fill);
        g.fillRoundedRectangle (bounds, corner);

        // Gold frame
        float frameAlpha = isDown ? 1.0f : isHighlighted ? 0.9f : 0.75f;
        g.setColour (juce::Colour (0xffc8922a).withAlpha (frameAlpha));
        g.drawRoundedRectangle (bounds, corner, isDown ? 2.5f : 1.5f);

        // Subtle inner highlight on top edge
        if (!isDown)
        {
            g.setColour (juce::Colour (0x22ffffff));
            g.drawLine (bounds.getX() + corner, bounds.getY() + 1.f,
                        bounds.getRight() - corner, bounds.getY() + 1.f, 1.f);
        }
    }

    //==========================================================================
    // Button text
    //==========================================================================
    void drawButtonText (juce::Graphics& g,
                         juce::TextButton& button,
                         bool /*isHighlighted*/,
                         bool isDown) override
    {
        g.setFont (juce::Font (13.f, juce::Font::bold));
        g.setColour (isDown ? juce::Colour (0xffc8922a)
                            : juce::Colour (0xffdfaa44));
        g.drawFittedText (button.getButtonText(),
                          button.getLocalBounds(),
                          juce::Justification::centred, 1);
    }

    //==========================================================================
    // Paint distressed metal background onto any component
    //==========================================================================
    void paintDistressedBackground (juce::Graphics& g, juce::Component& comp)
    {
        const int w = comp.getWidth();
        const int h = comp.getHeight();

        // Base fill
        g.fillAll (juce::Colour (0xff1a1a1a));

        // Top-to-bottom gradient
        g.setGradientFill (juce::ColourGradient (
            juce::Colour (0xff2a2826), 0.f, 0.f,
            juce::Colour (0xff111110), 0.f, (float) h, false));
        g.fillRect (0, 0, w, h);

        // Baked scratch lines
        for (int i = 0; i < kNumScratch; ++i)
        {
            float fy = scratchY[i] * (float) h;
            g.setColour (juce::Colours::white.withAlpha (scratchAlpha[i]));
            g.drawLine (0.f, fy, (float) w, fy, 0.5f);
        }
    }

    // Public scratch data (read by editor if needed)
    static constexpr int kNumScratch = 40;
    float scratchY    [kNumScratch];
    float scratchAlpha[kNumScratch];

private:
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HellRowdyLookAndFeel)
};
