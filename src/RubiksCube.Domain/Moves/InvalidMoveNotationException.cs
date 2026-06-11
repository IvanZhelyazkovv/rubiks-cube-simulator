namespace RubiksCube.Domain.Moves;

/// <summary>
/// Thrown when a move sequence string cannot be parsed as Singmaster notation.
/// </summary>
public sealed class InvalidMoveNotationException : Exception
{
    /// <summary>
    /// Initializes a new instance of the <see cref="InvalidMoveNotationException"/> class.
    /// </summary>
    /// <param name="notation">The full input string that failed to parse.</param>
    /// <param name="position">The zero-based character index at which parsing failed.</param>
    public InvalidMoveNotationException(string notation, int position)
        : base($"Invalid move notation at position {position}: '{notation}'. " +
               "Expected a face letter (U, D, F, B, L, R) optionally followed by ' or 2, " +
               "with moves separated by spaces.")
    {
        Notation = notation;
        Position = position;
    }

    /// <summary>The full input string that failed to parse.</summary>
    public string Notation { get; }

    /// <summary>The zero-based character index at which parsing failed.</summary>
    public int Position { get; }
}
