using RubiksCube.Domain.Geometry;

namespace RubiksCube.Tests.Domain.Geometry;

public sealed class Vector3IntTests
{
    /// <summary>
    /// Hand-derived 90° clockwise rotations of basis vectors, as seen by an observer
    /// looking from the tip of the axis towards the origin: (axis, vector, expected).
    /// </summary>
    private static readonly (Vector3Int Axis, Vector3Int Vector, Vector3Int Expected)[] ClockwiseCases =
    [
        // Around +Z (front axis): up goes right, right goes down, down goes left, left goes up.
        (Vector3Int.UnitZ, Vector3Int.UnitY, Vector3Int.UnitX),
        (Vector3Int.UnitZ, Vector3Int.UnitX, -Vector3Int.UnitY),
        (Vector3Int.UnitZ, -Vector3Int.UnitY, -Vector3Int.UnitX),
        (Vector3Int.UnitZ, -Vector3Int.UnitX, Vector3Int.UnitY),
        (Vector3Int.UnitZ, Vector3Int.UnitZ, Vector3Int.UnitZ),

        // Around +Y (up axis): front goes left, left goes back, back goes right, right goes front.
        (Vector3Int.UnitY, Vector3Int.UnitZ, -Vector3Int.UnitX),
        (Vector3Int.UnitY, -Vector3Int.UnitX, -Vector3Int.UnitZ),
        (Vector3Int.UnitY, -Vector3Int.UnitZ, Vector3Int.UnitX),
        (Vector3Int.UnitY, Vector3Int.UnitX, Vector3Int.UnitZ),
        (Vector3Int.UnitY, Vector3Int.UnitY, Vector3Int.UnitY),

        // Around +X (right axis): front goes up, up goes back, back goes down, down goes front.
        (Vector3Int.UnitX, Vector3Int.UnitZ, Vector3Int.UnitY),
        (Vector3Int.UnitX, Vector3Int.UnitY, -Vector3Int.UnitZ),
        (Vector3Int.UnitX, -Vector3Int.UnitZ, -Vector3Int.UnitY),
        (Vector3Int.UnitX, -Vector3Int.UnitY, Vector3Int.UnitZ),
        (Vector3Int.UnitX, Vector3Int.UnitX, Vector3Int.UnitX),
    ];

    [Fact]
    public void RotateClockwiseAround_MapsBasisVectorsExactly()
    {
        foreach (var (axis, vector, expected) in ClockwiseCases)
        {
            Assert.Equal(expected, vector.RotateClockwiseAround(axis));
        }
    }

    [Fact]
    public void RotateCounterClockwiseAround_IsInverseOfClockwise()
    {
        foreach (var (axis, vector, _) in ClockwiseCases)
        {
            Assert.Equal(vector, vector.RotateClockwiseAround(axis).RotateCounterClockwiseAround(axis));
        }
    }

    [Fact]
    public void RotateClockwiseAround_FourTimesIsIdentity()
    {
        foreach (var (axis, vector, _) in ClockwiseCases)
        {
            var rotated = vector;
            for (var i = 0; i < 4; i++)
            {
                rotated = rotated.RotateClockwiseAround(axis);
            }

            Assert.Equal(vector, rotated);
        }
    }

    [Fact]
    public void Dot_OfOrthogonalVectors_IsZero()
    {
        Assert.Equal(0, Vector3Int.UnitX.Dot(Vector3Int.UnitY));
        Assert.Equal(0, Vector3Int.UnitY.Dot(Vector3Int.UnitZ));
        Assert.Equal(0, Vector3Int.UnitZ.Dot(Vector3Int.UnitX));
    }

    [Fact]
    public void Cross_FollowsRightHandRule()
    {
        Assert.Equal(Vector3Int.UnitZ, Vector3Int.UnitX.Cross(Vector3Int.UnitY));
        Assert.Equal(Vector3Int.UnitX, Vector3Int.UnitY.Cross(Vector3Int.UnitZ));
        Assert.Equal(Vector3Int.UnitY, Vector3Int.UnitZ.Cross(Vector3Int.UnitX));
    }
}
