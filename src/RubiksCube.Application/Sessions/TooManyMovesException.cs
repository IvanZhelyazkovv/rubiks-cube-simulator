namespace RubiksCube.Application.Sessions;

/// <summary>
/// Thrown when a single request asks for more moves than the service accepts.
/// </summary>
public sealed class TooManyMovesException : Exception
{
    /// <summary>Creates the exception for the rejected move count.</summary>
    /// <param name="count">The number of moves requested.</param>
    /// <param name="maxCount">The largest accepted number of moves per request.</param>
    public TooManyMovesException(int count, int maxCount)
        : base($"At most {maxCount} moves may be applied per request; {count} were sent.")
    {
        Count = count;
        MaxCount = maxCount;
    }

    /// <summary>The number of moves requested.</summary>
    public int Count { get; }

    /// <summary>The largest accepted number of moves per request.</summary>
    public int MaxCount { get; }
}
