namespace RubiksCube.Domain.Moves;

/// <summary>
/// How far, and which way, a face is rotated — always as seen by an observer
/// looking straight at that face from outside the cube.
/// </summary>
public enum RotationDirection
{
    /// <summary>A 90° clockwise rotation (e.g. <c>F</c>).</summary>
    Clockwise,

    /// <summary>A 90° counter-clockwise rotation (e.g. <c>F'</c>).</summary>
    CounterClockwise,

    /// <summary>A 180° rotation (e.g. <c>F2</c>).</summary>
    HalfTurn,
}
