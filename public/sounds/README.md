# Quiz Sound Effects

This directory contains sound effect files for the quiz feature.

## Required Files

The following sound files are expected by the quiz system:

| File | Purpose | Recommended Duration |
|------|---------|---------------------|
| `correct.mp3` | Played when user selects correct answer | 0.5-1s |
| `incorrect.mp3` | Played when user selects incorrect answer | 0.5-1s |
| `warning.mp3` | Played when timer is below 5 seconds | 0.3-0.5s |
| `timeup.mp3` | Played when timer expires | 0.5-1s |
| `complete.mp3` | Played when quiz is completed | 1-2s |

## Recommended Sound Characteristics

- **correct.mp3**: Positive, uplifting tone (chime, ding, success sound)
- **incorrect.mp3**: Neutral negative tone (buzz, soft error sound)
- **warning.mp3**: Alert tone (tick, beep)
- **timeup.mp3**: Urgent tone (alarm, buzzer)
- **complete.mp3**: Celebratory tone (fanfare, achievement sound)

## Free Sound Resources

You can find royalty-free sound effects at:
- [Freesound.org](https://freesound.org/)
- [Mixkit](https://mixkit.co/free-sound-effects/)
- [Pixabay](https://pixabay.com/sound-effects/)

## Notes

- Keep file sizes small (< 50KB each) for fast loading
- MP3 format is recommended for broad browser support
- The quiz system will gracefully handle missing files
