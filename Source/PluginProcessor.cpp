#include "PluginProcessor.h"
#include "PluginEditor.h"

//==============================================================================
HellRowdyProcessor::HellRowdyProcessor()
    : AudioProcessor (BusesProperties()
                        .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "Parameters", createParameterLayout())
{
}

HellRowdyProcessor::~HellRowdyProcessor() {}

//==============================================================================
juce::AudioProcessorValueTreeState::ParameterLayout
HellRowdyProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        "buck",     "Buck",     0.0f, 1.0f, 0.5f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        "darkness", "Darkness", 0.0f, 1.0f, 0.5f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        "hollow",   "Hollow",   0.0f, 1.0f, 0.5f));

    return { params.begin(), params.end() };
}

//==============================================================================
void HellRowdyProcessor::prepareToPlay (double sampleRate, int /*samplesPerBlock*/)
{
    currentSampleRate = sampleRate;
    pendingQueue.clear();
}

void HellRowdyProcessor::releaseResources()
{
    pendingQueue.clear();
}

//==============================================================================
void HellRowdyProcessor::processBlock (juce::AudioBuffer<float>& buffer,
                                       juce::MidiBuffer& midi)
{
    buffer.clear();
    midi.clear();

    // Generate new MIDI pattern when triggered by the UI
    if (generateMidi.exchange (false))
    {
        pendingQueue.clear();

        float buck     = *apvts.getRawParameterValue ("buck");
        float darkness = *apvts.getRawParameterValue ("darkness");
        float hollow   = *apvts.getRawParameterValue ("hollow");

        // Map parameters to musical values
        int baseNote    = 48 + juce::roundToInt (darkness * 24);  // C3-C5
        int velocity    = 40 + juce::roundToInt (hollow   * 87);  // 40-127
        int numNotes    = 4  + juce::roundToInt (buck      * 12); // 4-16

        // Step duration: 0.15s at min buck, 0.06s at max
        int stepSamples = juce::roundToInt (
            currentSampleRate * (0.15 - buck * 0.09));

        // Pentatonic scale intervals
        static const int penta[] = { 0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26 };
        const int pentaLen = static_cast<int> (std::size (penta));

        for (int i = 0; i < numNotes; ++i)
        {
            int pitch      = juce::jlimit (0, 127, baseNote + penta[i % pentaLen]);
            int onSample   = i * stepSamples;
            int offSample  = onSample + stepSamples - juce::jmax (50, stepSamples / 8);

            pendingQueue.push_back ({ onSample,  pitch, velocity, true  });
            pendingQueue.push_back ({ offSample, pitch, 0,        false });
        }

        std::sort (pendingQueue.begin(), pendingQueue.end(),
                   [] (const PendingNote& a, const PendingNote& b) {
                       return a.sampleOffset < b.sampleOffset; });
    }

    // Emit events that fall within this buffer, advance remaining offsets
    const int bufSize = buffer.getNumSamples();

    std::vector<PendingNote> remaining;
    remaining.reserve (pendingQueue.size());

    for (auto& n : pendingQueue)
    {
        if (n.sampleOffset < bufSize)
        {
            int s = juce::jmax (0, n.sampleOffset);
            if (n.noteOn)
                midi.addEvent (juce::MidiMessage::noteOn  (1, n.pitch, (juce::uint8) n.velocity), s);
            else
                midi.addEvent (juce::MidiMessage::noteOff (1, n.pitch), s);
        }
        else
        {
            remaining.push_back ({ n.sampleOffset - bufSize, n.pitch, n.velocity, n.noteOn });
        }
    }

    pendingQueue = std::move (remaining);
}

//==============================================================================
juce::AudioProcessorEditor* HellRowdyProcessor::createEditor()
{
    return new HellRowdyEditor (*this);
}

//==============================================================================
void HellRowdyProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml (state.createXml());
    copyXmlToBinary (*xml, destData);
}

void HellRowdyProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml (getXmlFromBinary (data, sizeInBytes));
    if (xml != nullptr && xml->hasTagName (apvts.state.getType()))
        apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

//==============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new HellRowdyProcessor();
}
