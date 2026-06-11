namespace RubiksCube.Domain.Geometry;

/// <summary>
/// An immutable three-dimensional vector with integer components.
/// Used to describe sticker positions and face normals exactly, with no
/// floating-point error: every 90° rotation maps integer vectors to integer vectors.
/// </summary>
/// <param name="X">The component along the X axis (positive towards the right face).</param>
/// <param name="Y">The component along the Y axis (positive towards the up face).</param>
/// <param name="Z">The component along the Z axis (positive towards the front face).</param>
internal readonly record struct Vector3Int(int X, int Y, int Z)
{
    /// <summary>Unit vector pointing towards the right face (+X).</summary>
    public static Vector3Int UnitX { get; } = new(1, 0, 0);

    /// <summary>Unit vector pointing towards the up face (+Y).</summary>
    public static Vector3Int UnitY { get; } = new(0, 1, 0);

    /// <summary>Unit vector pointing towards the front face (+Z).</summary>
    public static Vector3Int UnitZ { get; } = new(0, 0, 1);

    /// <summary>Adds two vectors component-wise.</summary>
    public static Vector3Int operator +(Vector3Int left, Vector3Int right) =>
        new(left.X + right.X, left.Y + right.Y, left.Z + right.Z);

    /// <summary>Negates a vector.</summary>
    public static Vector3Int operator -(Vector3Int value) =>
        new(-value.X, -value.Y, -value.Z);

    /// <summary>Scales a vector by an integer factor.</summary>
    public static Vector3Int operator *(int scalar, Vector3Int value) =>
        new(scalar * value.X, scalar * value.Y, scalar * value.Z);

    /// <summary>Computes the dot product of two vectors.</summary>
    public int Dot(Vector3Int other) => (X * other.X) + (Y * other.Y) + (Z * other.Z);

    /// <summary>Computes the cross product of this vector with <paramref name="other"/>.</summary>
    public Vector3Int Cross(Vector3Int other) =>
        new(
            (Y * other.Z) - (Z * other.Y),
            (Z * other.X) - (X * other.Z),
            (X * other.Y) - (Y * other.X));

    /// <summary>
    /// Rotates this vector by 90° around the given unit <paramref name="axis"/>,
    /// clockwise as seen by an observer looking from the tip of the axis towards the origin.
    /// </summary>
    /// <remarks>
    /// For a unit axis <c>a</c> and a 90° rotation the Rodrigues formula collapses to
    /// <c>v' = a(a·v) ∓ a×v</c>; the minus sign yields the clockwise (negative, right-handed)
    /// rotation used here.
    /// </remarks>
    public Vector3Int RotateClockwiseAround(Vector3Int axis) =>
        (Dot(axis) * axis) + (-axis.Cross(this));

    /// <summary>
    /// Rotates this vector by 90° around the given unit <paramref name="axis"/>,
    /// counter-clockwise as seen by an observer looking from the tip of the axis towards the origin.
    /// </summary>
    public Vector3Int RotateCounterClockwiseAround(Vector3Int axis) =>
        (Dot(axis) * axis) + axis.Cross(this);
}
