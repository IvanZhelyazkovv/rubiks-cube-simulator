namespace RubiksCube.Application.Sessions;

/// <summary>
/// Thrown when undo is requested on a session whose move history is empty.
/// </summary>
public sealed class EmptyMoveHistoryException : Exception
{
    /// <summary>Creates the exception for the given session <paramref name="id"/>.</summary>
    /// <param name="id">The session whose history is empty.</param>
    public EmptyMoveHistoryException(Guid id)
        : base($"Cube session '{id}' has no moves to undo.")
    {
        Id = id;
    }

    /// <summary>The session whose history is empty.</summary>
    public Guid Id { get; }
}
