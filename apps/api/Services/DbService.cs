using Dapper;
using FoodApi.Models;
using Microsoft.Data.Sqlite;

namespace FoodApi.Services;

public class DbService
{
    private readonly string _dbPath;

    private const string Query = """
        SELECT f.slug, f.name, f.type,
               f.calories, f.fat, f.sat_fat, f.protein, f.fiber,
               f.sodium, f.carbs, f.sugar, f.cholesterol, f.trans_fat,
               f.yield_kg_ha, f.emissions_per_kg, f.water_per_kg,
               f.green_water_per_kg, f.blue_water_per_kg, f.grey_water_per_kg,
               f.pesticide_insect_paf, f.pesticide_terrestrial_paf,
               f.pesticide_bee_hazard, f.pesticide_kg_per_kg_food,
               f.neuron_count, f.weight_kg, f.yield_fraction,
               f.pasture_ha_per_kg_output,
               f.ch4_kg_per_kg_output, f.n2o_kg_per_kg_output, f.co2_kg_per_kg_output,
               feed.water_per_kg              AS feed_water_per_kg,
               feed.emissions_per_kg          AS feed_emissions_per_kg,
               feed.green_water_per_kg        AS feed_green_water_per_kg,
               feed.blue_water_per_kg         AS feed_blue_water_per_kg,
               feed.grey_water_per_kg         AS feed_grey_water_per_kg,
               feed.pesticide_insect_paf      AS feed_pesticide_insect_paf,
               feed.pesticide_terrestrial_paf AS feed_pesticide_terrestrial_paf,
               feed.pesticide_bee_hazard      AS feed_pesticide_bee_hazard,
               feed.pesticide_kg_per_kg_food  AS feed_pesticide_kg_per_kg_food,
               feed.land_m2_per_kg            AS feed_land_m2_per_kg
        FROM   foods_normalized f
        LEFT JOIN foods_normalized feed
               ON feed.food_id = f.food_id AND feed.is_feed = 1
        WHERE  f.is_feed = 0
        """;

    public DbService(IConfiguration config)
    {
        var dataDir = config["DATA_DIR"]
            ?? throw new InvalidOperationException("DATA_DIR is not configured.");
        var version = config["DB_VERSION"]
            ?? throw new InvalidOperationException("DB_VERSION is not configured.");
        _dbPath = Path.Combine(dataDir, $"foods-normalized.{version}.db");
    }

    public IEnumerable<FoodRow> LoadFoods()
    {
        using var conn = new SqliteConnection($"Data Source={_dbPath};Mode=ReadOnly");
        return conn.Query<FoodRow>(Query);
    }
}
