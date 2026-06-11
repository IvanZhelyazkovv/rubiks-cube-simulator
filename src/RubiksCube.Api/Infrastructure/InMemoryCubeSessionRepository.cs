using System.Collections.Concurrent;

using RubiksCube.Application.Sessions;

namespace RubiksCube.Api.Infrastructure;

/// <summary>
/// Thread-safe in-memory implementation of the session store. Sessions are immutable
/// records, so atomic updates reduce to compare-and-swap on the dictionary entry.
/// </summary>
/// <remarks>
/// <para>
/// This adapter lives in the API project on purpose: it is the composition root's
/// only piece of infrastructure, and a dedicated Infrastructure project holding a
/// single dictionary would be structure without substance. Extracting one becomes
/// worthwhile the moment real persistence appears.
/// </para>
/// <para>
/// The store is bounded: when adding a session would exceed the capacity, the
/// least-recently-touched sessions are evicted. Abandoned cubes (closed browser
/// tabs, crashed scripts) therefore cannot grow the process without limit.
/// </para>
/// </remarks>
public sealed class InMemoryCubeSessionRepository : ICubeSessionRepository
{
    private readonly ConcurrentDictionary<Guid, Entry> _sessions = new();
    private readonly int _capacity;
    private long _clock;

    /// <summary>Creates a store holding at most <paramref name="capacity"/> sessions.</summary>
    /// <param name="capacity">The maximum number of sessions kept before eviction.</param>
    public InMemoryCubeSessionRepository(int capacity = 1000)
    {
        if (capacity < 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(capacity), capacity, "Capacity must be at least 1.");
        }

        _capacity = capacity;
    }

    /// <inheritdoc />
    public CubeSession Get(Guid id)
    {
        if (!_sessions.TryGetValue(id, out var entry))
        {
            throw new CubeSessionNotFoundException(id);
        }

        Touch(id, entry);
        return entry.Session;
    }

    /// <inheritdoc />
    public void Add(CubeSession session)
    {
        ArgumentNullException.ThrowIfNull(session);

        if (!_sessions.TryAdd(session.Id, NewEntry(session)))
        {
            throw new InvalidOperationException($"A session with id '{session.Id}' already exists.");
        }

        // Evicting after the add keeps a duplicate-id failure from costing an
        // innocent session; the count may transiently exceed capacity by the
        // number of concurrent adds, which is harmless.
        EvictLeastRecentlyTouchedWhileOverCapacity(protectedId: session.Id);
    }

    /// <inheritdoc />
    public CubeSession Update(Guid id, Func<CubeSession, CubeSession> update)
    {
        ArgumentNullException.ThrowIfNull(update);

        while (true)
        {
            if (!_sessions.TryGetValue(id, out var current))
            {
                throw new CubeSessionNotFoundException(id);
            }

            var updated = NewEntry(update(current.Session));
            if (_sessions.TryUpdate(id, updated, current))
            {
                return updated.Session;
            }

            // Another request changed the session between read and write; retry on
            // the fresh value so neither update is lost.
        }
    }

    /// <inheritdoc />
    public bool Delete(Guid id) => _sessions.TryRemove(id, out _);

    private Entry NewEntry(CubeSession session) =>
        new(Interlocked.Increment(ref _clock), session);

    // The compare-and-swap below relies on Entry being a record: TryUpdate
    // compares the stored entry to the one this thread read by value, so a
    // concurrent change (different session or timestamp) makes the swap fail
    // harmlessly instead of overwriting it.
    private void Touch(Guid id, Entry entry) =>
        _sessions.TryUpdate(id, entry with { Touched = Interlocked.Increment(ref _clock) }, entry);

    private void EvictLeastRecentlyTouchedWhileOverCapacity(Guid protectedId)
    {
        while (_sessions.Count > _capacity)
        {
            var oldest = _sessions
                .Where(pair => pair.Key != protectedId)
                .MinBy(pair => pair.Value.Touched);
            if (oldest.Value is null)
            {
                return;
            }

            _sessions.TryRemove(oldest.Key, out _);
        }
    }

    /// <summary>
    /// A stored session stamped with a logical last-touched time. The always-unique
    /// <see cref="Touched"/> comes first so the CAS equality check fails fast
    /// instead of comparing whole cubes.
    /// </summary>
    private sealed record Entry(long Touched, CubeSession Session);
}
