using RubiksCube.Application.Rendering;
using RubiksCube.Application.UseCases;
using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Cli;

/// <summary>
/// Console entry point. With no arguments it runs the task's verification scenario:
/// a solved cube (green front, red right, white up) with the sequence
/// <c>F R' U B' L D'</c> applied, printing the exploded view before and after.
/// A custom sequence and cube size can be supplied as arguments.
/// </summary>
public static class Program
{
    private const string TaskSequence = "F R' U B' L D'";

    /// <summary>
    /// Runs the simulator.
    /// </summary>
    /// <param name="args">
    /// Optional Singmaster moves (e.g. <c>F R' U2</c>) and an optional
    /// <c>--size N</c> switch selecting the cube size (default 3).
    /// </param>
    /// <returns>0 on success, 1 when the arguments are invalid.</returns>
    public static int Main(string[] args)
    {
        if (!TryParseArguments(args, out var size, out var notation, out var error))
        {
            Console.Error.WriteLine(error);
            Console.Error.WriteLine();
            Console.Error.WriteLine("Usage: RubiksCube.Cli [moves] [--size N]");
            Console.Error.WriteLine($"Example: RubiksCube.Cli \"{TaskSequence}\" --size 3");
            return 1;
        }

        MoveSequence moves;
        try
        {
            moves = MoveSequence.Parse(notation);
        }
        catch (InvalidMoveNotationException exception)
        {
            Console.Error.WriteLine(exception.Message);
            return 1;
        }

        var solved = Cube.CreateSolved(size);

        Console.WriteLine($"Rubik's cube simulator ({size}x{size}x{size})");
        Console.WriteLine();
        Console.WriteLine("Solved starting position (green front, red right, white up):");
        Console.WriteLine();
        WriteNet(solved);

        Console.WriteLine($"Moves applied: {(moves.Count > 0 ? moves.ToString() : "(none)")}");
        Console.WriteLine();
        Console.WriteLine("Result:");
        Console.WriteLine();
        WriteNet(solved.Apply(moves));

        return 0;
    }

    private static bool TryParseArguments(
        string[] args, out int size, out string notation, out string error)
    {
        size = 3;
        notation = TaskSequence;
        error = string.Empty;

        var moveArguments = new List<string>();

        for (var i = 0; i < args.Length; i++)
        {
            if (args[i] == "--size")
            {
                if (i + 1 >= args.Length || !int.TryParse(args[i + 1], out size))
                {
                    error = "--size requires a number, e.g. --size 4.";
                    return false;
                }

                // The same size policy as the API — one rule for every entry point.
                if (size is < Cube.MinSize or > CreateCubeUseCase.MaxSize)
                {
                    error = $"Cube size must be between {Cube.MinSize} and {CreateCubeUseCase.MaxSize}.";
                    return false;
                }

                i++;
                continue;
            }

            if (args[i].StartsWith("--", StringComparison.Ordinal))
            {
                error = $"Unknown option '{args[i]}'.";
                return false;
            }

            moveArguments.Add(args[i]);
        }

        if (moveArguments.Count > 0)
        {
            notation = string.Join(' ', moveArguments);
        }

        return true;
    }

    /// <summary>
    /// Writes the exploded view, colouring each sticker letter when the output
    /// is an interactive terminal. Redirected output stays plain text.
    /// </summary>
    private static void WriteNet(Cube cube)
    {
        var net = CubeNetRenderer.Render(cube);

        if (Console.IsOutputRedirected)
        {
            Console.Write(net);
            Console.WriteLine();
            return;
        }

        foreach (var character in net)
        {
            var color = CharacterColor(character);
            if (color is { } consoleColor)
            {
                Console.ForegroundColor = consoleColor;
            }

            Console.Write(character);
            Console.ResetColor();
        }

        Console.WriteLine();
    }

    private static ConsoleColor? CharacterColor(char letter) => letter switch
    {
        'W' => ConsoleColor.White,
        'Y' => ConsoleColor.Yellow,
        'G' => ConsoleColor.Green,
        'B' => ConsoleColor.Blue,
        'R' => ConsoleColor.Red,
        'O' => ConsoleColor.DarkYellow,
        _ => null,
    };
}
