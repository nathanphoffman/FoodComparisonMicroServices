using Dapper;
using FoodApi.Models;
using Microsoft.Data.Sqlite;

namespace FoodApi.Services;

public class DbService
{
    private readonly string _dataDir;
    private readonly string? _pinnedVersion;

    private const string Query = """
        SELECT food.slug, food.name, food.type,
               food.calories, food.fat, food.sat_fat, food.protein, food.fiber,
               food.sodium, food.carbs, food.sugar, food.cholesterol, food.trans_fat, food.micronutrients, food.amino_acids,
               food.yield_kg_ha, food.emissions_per_kg, food.water_per_kg,
               food.green_water_per_kg, food.blue_water_per_kg, food.grey_water_per_kg,
               food.pesticide_insect_paf, food.pesticide_terrestrial_paf,
               food.pesticide_bee_hazard, food.pesticide_kg_per_kg_food,
               food.neuron_count, food.weight_kg, food.lifetime_output_kg, food.yield_fraction,
               food.offspring_deaths_per_animal, food.offspring_captivity_years,
               food.pasture_ha_per_kg_output,
               food.ch4_kg_per_kg_output, food.n2o_kg_per_kg_output, food.co2_kg_per_kg_output,
               food.bycatch_amount, food.bycatch_food_slug,
               food.wild_fish_kg_per_kg, food.wild_fish_neuron_count,
               food.wild_fish_weight_kg, food.wild_fish_lifespan_years,
               feed.water_per_kg              AS feed_water_per_kg,
               feed.emissions_per_kg          AS feed_emissions_per_kg,
               feed.green_water_per_kg        AS feed_green_water_per_kg,
               feed.blue_water_per_kg         AS feed_blue_water_per_kg,
               feed.grey_water_per_kg         AS feed_grey_water_per_kg,
               feed.pesticide_insect_paf      AS feed_pesticide_insect_paf,
               feed.pesticide_terrestrial_paf AS feed_pesticide_terrestrial_paf,
               feed.pesticide_bee_hazard      AS feed_pesticide_bee_hazard,
               feed.pesticide_kg_per_kg_food  AS feed_pesticide_kg_per_kg_food,
               feed.land_m2_per_kg            AS feed_land_m2_per_kg,
               bycatch_animal.neuron_count    AS bycatch_neuron_count,
               bycatch_animal.weight_kg       AS bycatch_weight_kg,
               food.availability_gg, food.sentient_harm_explanation, food.land_types,
               food.category, food.tags
        FROM   foods_normalized food
        LEFT JOIN foods_normalized feed
               ON feed.food_id = food.food_id AND feed.is_feed = 1 AND feed.region = food.region
        LEFT JOIN foods_normalized bycatch_animal
               ON bycatch_animal.slug = food.bycatch_food_slug AND bycatch_animal.is_feed = 0
              AND bycatch_animal.region = food.region
        WHERE  food.is_feed = 0 AND food.region = @Region
        """;

    // Regions built by the data pipeline (see services/data-pipeline/src/lib/regions.py)
    public static readonly string[] Regions = ["world", "us", "avg"];

    public DbService(IConfiguration config, IWebHostEnvironment env)
    {
        // DATA_DIR: use config if set, otherwise derive from the project root
        // (ContentRootPath = apps/api/, so ../../data/db = project root/data/db)
        _dataDir = config["DATA_DIR"]
            ?? Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "data", "db"));

        // DB_VERSION: pinned if set in config; otherwise the latest version is
        // re-resolved on every request so a rebuilt DB is picked up without a restart.
        _pinnedVersion = config["DB_VERSION"];
    }

    private string CurrentDbPath()
    {
        var version = _pinnedVersion ?? InferVersion(_dataDir);
        return Path.Combine(_dataDir, $"foods-normalized.{version}.db");
    }

    // Scans dataDir for foods-normalized.vN.db files and returns the highest version.
    private static string InferVersion(string dataDir)
    {
        var files = Directory.GetFiles(dataDir, "foods-normalized.*.db");
        if (files.Length == 0)
            throw new InvalidOperationException(
                $"No foods-normalized.*.db found in {dataDir}. Run 'pnpm build-db' first.");

        return files
            .Select(filePath => Path.GetFileNameWithoutExtension(filePath).Replace("foods-normalized.", ""))
            .OrderByDescending(version => int.TryParse(version.TrimStart('v'), out int versionNumber) ? versionNumber : 0)
            .First();
    }

    public IEnumerable<FoodRow> LoadFoods(string region)
    {
        using var connection = new SqliteConnection($"Data Source={CurrentDbPath()};Mode=ReadOnly");
        return connection.Query<FoodRow>(Query, new { Region = region });
    }
}
