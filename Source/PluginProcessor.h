#pragma once

#include <JuceHeader.h>

//==============================================================================
// HellRowdy — MIDI Generator Processor
//
// Produces MIDI output; no audio I/O required from the host.
// When generateMidi is set true by the editor, processBlock schedules a
// pentatonic note pattern whose density/range/velocity is driven by BUCK,
// DARKNESS and HOLLOW parameters.
//==============================================================================
class HellRowdyProcessor : public juce::AudioProcessor
{
public:
    HellRowdyProcessor();
    ~HellRowdyProcessor() override;

    //==========================================================================
    void prepareToPlay  (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock   (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==========================================================================
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    //==========================================================================
    const juce::String getName() const override { return "Hell Rowdy"; }
    bool acceptsMidi()  const override { return false; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    //==========================================================================
    int  getNumPrograms()  override { return 1; }
    int  getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    //==========================================================================
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    //==========================================================================
    // Set to true from the UI thread; cleared by the audio thread
    std::atomic<bool> generateMidi { false };

    juce::AudioProcessorValueTreeState apvts;

private:
    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    struct PendingNote
    {
        int  sampleOffset;
        int  pitch;
        int  velocity;
        bool noteOn;
    };

    std::vector<PendingNote> pendingQueue;

    double currentSampleRate { 44100.0 };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HellRowdyProcessor)
};
