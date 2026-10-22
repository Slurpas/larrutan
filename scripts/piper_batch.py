"""Synthesises many sentences with one loaded Piper voice.

Usage: python piper_batch.py <model.onnx> <jobs.json> <length_scale>
jobs.json is a list of {"text": ..., "wav": ...}. length_scale above 1 speaks
more slowly. Called by generate-speech.mjs.
"""

import json
import shutil
import sys
import tempfile
import wave
from pathlib import Path

import piper
from piper import PiperVoice, SynthesisConfig


def espeak_data_dir() -> Path:
    # espeak-ng cannot open its data from a path with non-ASCII characters
    # (like the ä in "Lärrutan"), so use a copy in the temp folder.
    target = Path(tempfile.gettempdir()) / "larrutan-espeak-ng-data"
    if not target.exists():
        shutil.copytree(Path(piper.__file__).parent / "espeak-ng-data", target)
    return target


def main() -> None:
    model_path, jobs_path, length_scale = sys.argv[1], sys.argv[2], float(sys.argv[3])
    jobs = json.loads(Path(jobs_path).read_text(encoding="utf-8"))
    voice = PiperVoice.load(model_path, espeak_data_dir=espeak_data_dir())
    config = SynthesisConfig(length_scale=length_scale)
    for job in jobs:
        with wave.open(job["wav"], "wb") as wav_file:
            voice.synthesize_wav(job["text"], wav_file, syn_config=config)
    print(f"synthesised {len(jobs)} clips")


if __name__ == "__main__":
    main()
