using System.Text.RegularExpressions;

namespace Sentinel.Domain;

/// <summary>
/// Content screening (ADR-0003), the same rules the phone runs, held to the
/// TypeScript by <c>fixtures/screen.json</c>. The server refuses free text the
/// phone would have refused, so a modified client gains nothing.
/// </summary>
public static partial class Screen
{
    private const string PersonNouns = "man|woman|boy|girl|guy|lady|men|women|boys|girls|person|people|youths?|individuals?|okada rider|driver|conductor";

    private static readonly Regex Phone = new(@"\b(?:\+?234|0)[789][01]\d{8}\b", RegexOptions.Compiled);
    private static readonly Regex Plate = new(@"\b[A-Z]{3}[-\s]?\d{2,3}[-\s]?[A-Z]{2}\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Descriptor = new(
        $@"\b(tall|short|fat|slim|thin|dark|light[- ]skinned|fair|bearded|bald|old|young|huge|big)\s+({PersonNouns})\b|" +
        $@"\b({PersonNouns})\s+(in|wearing|with)\s+(a|an|the|black|white|red|blue|green|yellow|brown|grey|gray)\b|" +
        @"\b(he|she|they)\s+(was|were|is|are)\s+wearing\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Clothing = new(@"\b(wearing|dressed in|in a|in an)\s+(black|white|red|blue|green|yellow|brown|grey|gray|ankara|agbada|kaftan|hijab|jalabiya|cap|hoodie|jacket|shirt|trousers|jeans)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Identifier = new(@"\b(hausa|fulani|yoruba|igbo|ijaw|tiv|kanuri|efik|ibibio|edo|northerner|southerner|christian|muslim|pastor|imam|foreigner|beggar|almajiri|herdsmen|herder)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Title = new(@"\b(?:mr|mrs|miss|ms|alhaji|alhaja|chief|pastor|oga|madam|mallam|dr|engr|barr)\.?\s+[A-Z][a-z]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex PlaceWords = new(@"^(avenue|road|street|junction|estate|market|bridge|stop|roundabout|hospital|school|mosque|church|station|garage|close|crescent|lane|way|express|expressway|area|phase|gate|plaza|mall|park|island|beach|river|creek)$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    // Not IgnoreCase: the capitals are the point.
    private static readonly Regex Pair = new(@"\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b", RegexOptions.Compiled);

    private static bool LooksLikeName(string text)
    {
        foreach (Match m in Pair.Matches(text))
        {
            if (!PlaceWords.IsMatch(m.Groups[2].Value)) return true;
        }
        return false;
    }

    /// <summary>The on-device rules over one text, in the phone's order of reasons.</summary>
    public static (bool Ok, IReadOnlyList<string> Reasons) Text(string text)
    {
        var reasons = new List<string>();
        if (Phone.IsMatch(text)) reasons.Add("a phone number");
        if (Plate.IsMatch(text)) reasons.Add("a vehicle plate");
        if (Identifier.IsMatch(text)) reasons.Add("an ethnic or religious identifier");
        if (Descriptor.IsMatch(text)) reasons.Add("a description of a person");
        if (Clothing.IsMatch(text)) reasons.Add("clothing");
        if (Title.IsMatch(text) || LooksLikeName(text)) reasons.Add("a name");
        return (reasons.Count == 0, reasons);
    }
}
