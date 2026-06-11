using RubiksCube.Api.Infrastructure;
using RubiksCube.Application.Sessions;
using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Api;

public sealed class InMemoryCubeSessionRepositoryTests
{
    private readonly InMemoryCubeSessionRepository _repository = new();

    [Fact]
    public void Get_ReturnsWhatWasAdded()
    {
        var session = CubeSession.CreateNew(3);
        _repository.Add(session);

        Assert.Equal(session, _repository.Get(session.Id));
    }

    [Fact]
    public void Get_ThrowsForUnknownId()
    {
        Assert.Throws<CubeSessionNotFoundException>(() => _repository.Get(Guid.NewGuid()));
    }

    [Fact]
    public void Add_RejectsDuplicateIds()
    {
        var session = CubeSession.CreateNew(3);
        _repository.Add(session);

        Assert.Throws<InvalidOperationException>(() => _repository.Add(session));
    }

    [Fact]
    public void Update_ThrowsForUnknownId()
    {
        Assert.Throws<CubeSessionNotFoundException>(
            () => _repository.Update(Guid.NewGuid(), session => session));
    }

    [Fact]
    public void Delete_ReturnsWhetherTheSessionExisted()
    {
        var session = CubeSession.CreateNew(3);
        _repository.Add(session);

        Assert.True(_repository.Delete(session.Id));
        Assert.False(_repository.Delete(session.Id));
    }

    [Fact]
    public void Add_AtCapacityOne_KeepsTheNewSessionAndEvictsTheOld()
    {
        var bounded = new InMemoryCubeSessionRepository(capacity: 1);
        var first = CubeSession.CreateNew(3);
        var second = CubeSession.CreateNew(3);

        bounded.Add(first);
        bounded.Add(second);

        Assert.Equal(second, bounded.Get(second.Id));
        Assert.Throws<CubeSessionNotFoundException>(() => bounded.Get(first.Id));
    }

    [Fact]
    public void Add_EvictsTheLeastRecentlyTouchedSessionWhenFull()
    {
        var bounded = new InMemoryCubeSessionRepository(capacity: 2);
        var first = CubeSession.CreateNew(3);
        var second = CubeSession.CreateNew(3);
        bounded.Add(first);
        bounded.Add(second);

        // Touch the older session so the other one becomes the eviction candidate.
        bounded.Get(first.Id);
        bounded.Add(CubeSession.CreateNew(3));

        Assert.Equal(first, bounded.Get(first.Id));
        Assert.Throws<CubeSessionNotFoundException>(() => bounded.Get(second.Id));
    }

    [Fact]
    public void Constructor_RejectsNonPositiveCapacity()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new InMemoryCubeSessionRepository(0));
    }

    [Fact]
    public async Task Update_NeverLosesConcurrentUpdates()
    {
        var session = CubeSession.CreateNew(3);
        _repository.Add(session);

        // 64 tasks each record one move; with a lost update the history would be shorter.
        var move = new Move(Face.Front, RotationDirection.Clockwise);
        await Task.WhenAll(Enumerable.Range(0, 64).Select(_ => Task.Run(
            () => _repository.Update(session.Id, current => current.Apply([move])))));

        Assert.Equal(64, _repository.Get(session.Id).History.Count);
        Assert.True(_repository.Get(session.Id).Cube.IsSolved);
    }
}
