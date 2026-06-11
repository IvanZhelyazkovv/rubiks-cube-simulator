namespace RubiksCube.Domain.Moves;

/// <summary>
/// A single rotation of one face of the cube, expressed in Singmaster notation:
/// a face letter (<c>U D F B L R</c>) optionally followed by <c>'</c> for
/// counter-clockwise or <c>2</c> for a half turn.
/// </summary>
/// <param name="Face">The face to rotate.</param>
/// <param name="Direction">The direction and amount of rotation.</param>
public readonly record struct Move(Face Face, RotationDirection Direction)
{
    /// <summary>
    /// The move that undoes this one: <c>F</c> ↔ <c>F'</c>, while <c>F2</c> is its own inverse.
    /// </summary>
    public Move Inverse => Direction switch
    {
        RotationDirection.Clockwise => this with { Direction = RotationDirection.CounterClockwise },
        RotationDirection.CounterClockwise => this with { Direction = RotationDirection.Clockwise },
        _ => this,
    };

    /// <summary>Returns the move in Singmaster notation, e.g. <c>F</c>, <c>R'</c> or <c>U2</c>.</summary>
    public override string ToString()
    {
        var letter = Face switch
        {
            Face.Up => "U",
            Face.Down => "D",
            Face.Front => "F",
            Face.Back => "B",
            Face.Left => "L",
            Face.Right => "R",
            _ => throw new InvalidOperationException($"Unknown face '{Face}'."),
        };

        var modifier = Direction switch
        {
            RotationDirection.Clockwise => string.Empty,
            RotationDirection.CounterClockwise => "'",
            RotationDirection.HalfTurn => "2",
            _ => throw new InvalidOperationException($"Unknown rotation direction '{Direction}'."),
        };

        return letter + modifier;
    }
}
