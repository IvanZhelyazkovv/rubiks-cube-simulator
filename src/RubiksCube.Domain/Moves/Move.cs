namespace RubiksCube.Domain.Moves;

/// <summary>
/// A single rotation of one layer of the cube, expressed in Singmaster notation:
/// a face letter (<c>U D F B L R</c>) optionally followed by <c>'</c> for
/// counter-clockwise or <c>2</c> for a half turn. A digit prefix selects a deeper
/// layer behind that face — <c>2L</c> turns the second layer from the left (the
/// classic M slice on a 3×3), <c>3R'</c> the third layer from the right.
/// </summary>
/// <param name="Face">The face whose axis and direction the rotation follows.</param>
/// <param name="Direction">The direction and amount of rotation, as seen looking at <paramref name="Face"/>.</param>
/// <param name="Layer">The layer to turn, counted from <paramref name="Face"/>; 1 is the face itself.</param>
public readonly record struct Move(Face Face, RotationDirection Direction, int Layer = 1)
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

    /// <summary>Returns the move in Singmaster notation, e.g. <c>F</c>, <c>R'</c>, <c>U2</c> or <c>2L'</c>.</summary>
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

        var prefix = Layer > 1 ? Layer.ToString() : string.Empty;
        return prefix + letter + modifier;
    }
}
