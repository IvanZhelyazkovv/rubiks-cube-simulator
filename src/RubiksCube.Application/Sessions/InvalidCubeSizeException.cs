namespace RubiksCube.Application.Sessions;

/// <summary>
/// Thrown when a requested cube size is outside the range the service supports.
/// </summary>
public sealed class InvalidCubeSizeException : Exception
{
    /// <summary>Creates the exception for the rejected <paramref name="size"/>.</summary>
    /// <param name="size">The requested size.</param>
    /// <param name="minSize">The smallest supported size.</param>
    /// <param name="maxSize">The largest supported size.</param>
    public InvalidCubeSizeException(int size, int minSize, int maxSize)
        : base($"Cube size must be between {minSize} and {maxSize}; {size} was requested.")
    {
        Size = size;
    }

    /// <summary>The requested size.</summary>
    public int Size { get; }
}
