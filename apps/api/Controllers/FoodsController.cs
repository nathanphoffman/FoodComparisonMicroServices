using FoodApi.Models;
using FoodApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly DbService _db;

    public FoodsController(DbService dbService) => _db = dbService;

    /// <summary>
    /// Returns all raw food rows from the normalized DB.
    /// Scoring and slider math run client-side in the Rust WASM module.
    /// region selects which sourced values were used: world (default), us, or avg.
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<FoodRow>> Get([FromQuery] string region = "world")
    {
        region = region.ToLowerInvariant();
        if (!DbService.Regions.Contains(region))
            return BadRequest($"Unknown region '{region}'. Use one of: {string.Join(", ", DbService.Regions)}");
        return Ok(_db.LoadFoods(region));
    }
}
