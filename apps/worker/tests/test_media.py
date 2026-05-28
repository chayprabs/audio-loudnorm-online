from app.media import (
    cosine_like_similarity,
    downsample_levels,
    extract_last_json_block,
    parse_loudnorm_stats,
    parse_silencedetect_ranges,
)


def test_extract_last_json_block_returns_last_object():
    payload = """
    noise
    {"input_i": "-22.1", "input_lra": "4.2", "input_tp": "-1.4"}
    """
    assert extract_last_json_block(payload)["input_i"] == "-22.1"


def test_parse_loudnorm_stats_maps_expected_keys():
    stats = parse_loudnorm_stats(
        {"input_i": "-22.1", "input_lra": "4.2", "input_tp": "-1.4"},
        "input",
    )
    assert stats == {"I": -22.1, "LRA": 4.2, "TP": -1.4}


def test_downsample_levels_preserves_requested_zooms():
    levels = downsample_levels([0.1, -0.7, 0.3, 0.4], zoom_sizes=[2, 4])
    assert [level["zoom"] for level in levels] == [2, 4]
    assert levels[0]["samples"][0] == 0.7


def test_cosine_like_similarity_returns_one_for_identical_vectors():
    score = cosine_like_similarity([1, 2, 3], [1, 2, 3])
    assert score == 1.0


def test_parse_silencedetect_ranges_pairs_start_and_end():
    stderr = """
    [silencedetect] silence_start: 0
    [silencedetect] silence_end: 1.2 | silence_duration: 1.2
    [silencedetect] silence_start: 5.5
    [silencedetect] silence_end: 7.0 | silence_duration: 1.5
    """
    assert parse_silencedetect_ranges(stderr) == [
        {"start_sec": 0.0, "end_sec": 1.2},
        {"start_sec": 5.5, "end_sec": 7.0},
    ]
