import fs from "fs";

function generateBellWavBase64(): string {
  const sampleRate = 44100;
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 for Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate E5 (659.25 Hz) + A5 (880 Hz) harmonic chime
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Tone 1: E5 (starts at t=0, 0.5s decay)
    let sample1 = 0;
    if (t <= 0.6) {
      const decay1 = Math.exp(-t * 8);
      const fundamental1 = Math.sin(2 * Math.PI * 659.25 * t);
      const overtone1 = Math.sin(2 * Math.PI * 1318.5 * t) * 0.4;
      sample1 = (fundamental1 + overtone1) * decay1 * 0.4;
    }

    // Tone 2: A5 (starts at t=0.12, 0.8s decay)
    let sample2 = 0;
    if (t >= 0.12) {
      const t2 = t - 0.12;
      const decay2 = Math.exp(-t2 * 6);
      const fundamental2 = Math.sin(2 * Math.PI * 880 * t2);
      const overtone2 = Math.sin(2 * Math.PI * 1760 * t2) * 0.4;
      sample2 = (fundamental2 + overtone2) * decay2 * 0.5;
    }

    const val = Math.max(-1, Math.min(1, sample1 + sample2));
    const pcmVal = Math.floor(val * 32767);
    buffer.writeInt16LE(pcmVal, 44 + i * 2);
  }

  const base64 = buffer.toString("base64");
  return `data:audio/wav;base64,${base64}`;
}

const dataUri = generateBellWavBase64();
console.log("Base64 WAV Data URI length:", dataUri.length);
console.log("Sample snippet:", dataUri.substring(0, 100) + "...");

fs.writeFileSync("scratch/bell_uri.txt", dataUri);
