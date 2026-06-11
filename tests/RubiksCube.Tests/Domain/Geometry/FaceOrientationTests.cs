using RubiksCube.Domain;
using RubiksCube.Domain.Geometry;

namespace RubiksCube.Tests.Domain.Geometry;

public sealed class FaceOrientationTests
{
    public static TheoryData<Face> AllFaces =>
        [Face.Up, Face.Down, Face.Front, Face.Back, Face.Left, Face.Right];

    [Theory]
    [MemberData(nameof(AllFaces))]
    public void FromNormal_RoundTripsForEveryFace(Face face)
    {
        var orientation = FaceOrientation.Of(face);

        Assert.Equal(face, FaceOrientation.FromNormal(orientation.Normal));
    }

    [Theory]
    [MemberData(nameof(AllFaces))]
    public void Directions_AreMutuallyOrthogonalUnitVectors(Face face)
    {
        var orientation = FaceOrientation.Of(face);

        Assert.Equal(0, orientation.Normal.Dot(orientation.RowDirection));
        Assert.Equal(0, orientation.Normal.Dot(orientation.ColumnDirection));
        Assert.Equal(0, orientation.RowDirection.Dot(orientation.ColumnDirection));

        Assert.Equal(1, orientation.Normal.Dot(orientation.Normal));
        Assert.Equal(1, orientation.RowDirection.Dot(orientation.RowDirection));
        Assert.Equal(1, orientation.ColumnDirection.Dot(orientation.ColumnDirection));
    }

    [Fact]
    public void Normals_AreAllDistinct()
    {
        var normals = FaceOrientation.AllFaces
            .Select(face => FaceOrientation.Of(face).Normal)
            .Distinct()
            .Count();

        Assert.Equal(6, normals);
    }

    [Fact]
    public void FromNormal_ThrowsForNonNormalVector()
    {
        Assert.Throws<ArgumentException>(() => FaceOrientation.FromNormal(new Vector3Int(1, 1, 0)));
    }
}
