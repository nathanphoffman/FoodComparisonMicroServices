using FoodApi.Models;
using FoodApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly DbService _db;

    public FoodsController(DbService db) => _db = db;

    /// <summary>
    /// Returns all raw food rows from the normalized DB.
    /// Scoring and slider math run client-side in the Rust WASM module.
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<FoodRow>> Get()
    {
        return Ok(_db.LoadFoods());
    }
}
