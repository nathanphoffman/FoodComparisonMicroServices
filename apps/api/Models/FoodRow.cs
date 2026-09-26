using System.Text.Json;
using System.Text.Json.Serialization;

namespace FoodApi.Models;

/// <summary>
/// Maps the JOIN query result from foods_normalized.
/// Property names are PascalCase; the API serialises to snake_case via
/// JsonNamingPolicy.SnakeCaseLower, so the JSON output matches the
/// TypeScript RawFood type directly.
/// Equivalent to RawFood in apps/web/lib/queries/commonFoods.ts.
/// </summary>
public class FoodRow
{
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Type { get; set; } = "";       // "plant" | "animal"

    // Nutrition (per 100 g serving)
    public double  Calories    { get; set; }
    public double  Fat         { get; set; }
    public double  Protein     { get; set; }
    public double  Fiber       { get; set; }
    public double  SatFat      { get; set; }
    public double? Sodium      { get; set; }
    public double? Carbs       { get; set; }
    public double? Sugar       { get; set; }
    public double? Cholesterol { get; set; }
    public double? TransFat    { get; set; }

    // Plant metrics
    public double? YieldKgHa                 { get; set; }
    public double? CookedWeightRatio         { get; set; }
    public double? EmissionsPerKg            { get; set; }
    public double? WaterPerKg                { get; set; }
    public double? GreenWaterPerKg           { get; set; }
    public double? BlueWaterPerKg            { get; set; }
    public double? GreyWaterPerKg            { get; set; }
    public double? PesticideInsectPaf        { get; set; }
    public double? PesticideTerrestrialPaf   { get; set; }
    public double? PesticideBeeHazard        { get; set; }
    public double? PesticideKgPerKgFood      { get; set; }

    // Animal metrics
    public double? NeuronCount               { get; set; }
    public double? WeightKg                  { get; set; }
    public double? LifetimeOutputKg          { get; set; }
    public double? OffspringDeathsPerAnimal  { get; set; }
    public double? OffspringCaptivityYears   { get; set; }
    public double? YieldFraction             { get; set; }
    public double? PastureHaPerKgOutput      { get; set; }
    public double? Ch4KgPerKgOutput          { get; set; }
    public double? N2oKgPerKgOutput          { get; set; }
    public double? Co2KgPerKgOutput          { get; set; }

    // Bycatch — fishing collateral kill (NULL for non-seafood or no bycatch data)
    public double? BycatchAmount      { get; set; }
    public string? BycatchFoodSlug    { get; set; }
    public double? BycatchNeuronCount { get; set; }
    public double? BycatchWeightKg    { get; set; }

    // Feed aggregate columns (from the self-join)
    public double? FeedWaterPerKg                { get; set; }
    public double? FeedEmissionsPerKg            { get; set; }
    public double? FeedGreenWaterPerKg           { get; set; }
    public double? FeedBlueWaterPerKg            { get; set; }
    public double? FeedGreyWaterPerKg            { get; set; }
    public double? FeedPesticideInsectPaf        { get; set; }
    public double? FeedPesticideTerrestrialPaf   { get; set; }
    public double? FeedPesticideBeeHazard        { get; set; }
    public double? FeedPesticideKgPerKgFood      { get; set; }
    public double? FeedLandM2PerKg               { get; set; }

    // Global supply
    public double? AvailabilityGg { get; set; }

    // Plain-English tooltip text for the sentient harm columns (NULL if none)
    public string? SentientHarmExplanation { get; set; }

    // Land type split as stored in the DB: a JSON object string, NULL for foods with no farmland.
    // Dapper fills this; it's sent to the client as a parsed object via LandTypesJson.
    [JsonIgnore]
    public string? LandTypes { get; set; }

    [JsonPropertyName("land_types")]
    public JsonElement? LandTypesJson =>
        LandTypes is null ? null : JsonDocument.Parse(LandTypes).RootElement.Clone();

    // Food group from the source JSON file (e.g. "nuts", "leafy"); used by the table's filter buttons.
    public string? Category { get; set; }

    // Tags as stored in the DB: a JSON array string. Sent to the client as a parsed array via TagsJson.
    [JsonIgnore]
    public string? Tags { get; set; }

    [JsonPropertyName("tags")]
    public string[] TagsJson =>
        Tags is null ? [] : JsonSerializer.Deserialize<string[]>(Tags) ?? [];
}
