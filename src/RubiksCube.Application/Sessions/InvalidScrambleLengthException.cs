namespace RubiksCube.Application.Sessions;

/// <summary>
/// Thrown when a requested scramble length is outside the range the service supports.
/// </summary>
public sealed class InvalidScrambleLengthException : Exception
{
    /// <summary>Creates the exception for the rejected <paramref name="length"/>.</summary>
    /// <param name="length">The requested length.</param>
    /// <param name="maxLength">The largest supported length.</param>
    public InvalidScrambleLengthException(int length, int maxLength)
        : base($"Scramble length must be between 1 and {maxLength}; {length} was requested.")
    {
        Length = length;
    }

    /// <summary>The requested length.</summary>
    public int Length { get; }
}
