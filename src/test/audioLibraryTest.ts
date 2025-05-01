import { AudioLibrary } from "../utils/audioLibrary/audioLibrary";
async function runTest() {
  try {
    const callId = 'test-call-123';
    const audioPath = AudioLibrary.getAudioPath('introduce');
    console.log("Generated audio path:", audioPath);
  } catch (error) {
    console.error("Error during audio generation test:", error);
  }
}

runTest();
