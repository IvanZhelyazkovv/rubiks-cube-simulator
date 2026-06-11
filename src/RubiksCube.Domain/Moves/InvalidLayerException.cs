namespace RubiksCube.Domain.Moves;

/// <summary>
/// Thrown when a move addresses a layer that does not exist on the cube it is
/// applied to — e.g. <c>3R</c> on a 3×3, whose layers from the right are only
/// 1 (the face) and 2 (the middle slice).
/// </summary>
public sealed class InvalidLayerException : Exception
{
    /// <summary>Creates the exception for the rejected layer.</summary>
    /// <param name="layer">The requested layer.</param>
    /// <param name="size">The size of the cube the move was applied to.</param>
    public InvalidLayerException(int layer, int size)
        : base($"Layer {layer} does not exist on a {size}×{size} cube; layers run from 1 to {size - 1}.")
    {
        Layer = layer;
        Size = size;
    }

    /// <summary>The requested layer.</summary>
    public int Layer { get; }

    /// <summary>The size of the cube the move was applied to.</summary>
    public int Size { get; }
}
