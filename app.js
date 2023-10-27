const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 4000; // Puerto en el que se ejecutará tu servidor
app.use(cors()); // Habilita CORS

// Configura el middleware para parsear JSON y datos de formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos usando pg-promise
const pgp = require("pg-promise")();
const db = pgp({
  host: "localhost", // Cambia a la dirección de tu base de datos
  port: 5432, // Puerto de tu base de datos
  database: "db_vehicle_registration",
  user: "postgres",
  password: "123",
});

db.connect()
  .then((obj) => {
    console.log("Conexión a la base de datos exitosa");
    obj.done();
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
  });

// Ruta para la raíz
app.get("/", (req, res) => {
  res.send("Bienvenido a la API de gestión de vehículos");
});

// Ruta para crear un nuevo vehículo
app.post("/api/vehiculos/crear", async (req, res) => {
  const { marca, modelo, placa } = req.body;

  const existingVehicle = await db.oneOrNone(
    "SELECT * FROM vehiculos WHERE placa = $1",
    placa
  );

  if (existingVehicle) {
    return res.status(400).json({ error: "La placa ya está en uso" });
  }
  try {
    const newVehicle = await db.one(
      "INSERT INTO vehiculos(marca, modelo, placa) VALUES($1, $2, $3) RETURNING *",
      [marca, modelo, placa]
    );
    res.json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: "No se pudo crear el vehículo." });
  }
});

// Ruta para actualizar un vehículo existente
app.put("/api/vehiculos/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { marca, modelo, placa } = req.body;

  // Verifica si ya existe un vehículo con la misma placa, excluyendo el vehículo actual
  const existingVehicle = await db.oneOrNone(
    "SELECT * FROM vehiculos WHERE placa = $1 AND id <> $2",
    [placa, id]
  );

  if (existingVehicle) {
    return res.status(400).json({ error: "La placa ya está en uso" });
  }

  try {
    const updatedVehicle = await db.one(
      "UPDATE vehiculos SET marca=$1, modelo=$2, placa=$3 WHERE id=$4 RETURNING *",
      [marca, modelo, placa, id]
    );
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el vehículo." });
  }
});

// Ruta para eliminar un vehículo
app.delete("/api/vehiculos/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.none("DELETE FROM vehiculos WHERE id=$1", [id]);
    res.json({ message: "Vehículo eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el vehículo." });
  }
});

// Ruta para obtener una lista de todos los vehículos
app.get("/api/vehiculos/lista", async (req, res) => {
  try {
    const vehicles = await db.any("SELECT * FROM vehiculos");
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los vehículos." });
  }
});

// Ruta para registrar una entrada de un vehículo
app.post("/api/entradas", async (req, res) => {
  const { vehiculoId, nombre_motorista, fecha, hora, kilometraje } = req.body;
  try {
    const newEntryExit = await db.one(
      "INSERT INTO entradas(vehiculo_id, nombre_motorista, fecha, hora, kilometraje) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [vehiculoId, nombre_motorista, fecha, hora, kilometraje]
    );
    res.json(newEntryExit);
  } catch (error) {
    res.status(500).json({ error: "No se pudo registrar la entrada." });
  }
});



// Ruta para registrar una salida de un vehículo
app.post("/api/salidas", async (req, res) => {
  const { vehiculoId, motorista, fecha, hora, kilometraje } = req.body;
  try {
    const newEntryExit = await db.one(
      "INSERT INTO salidas(vehiculo_id, motorista, fecha, hora, kilometraje) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [vehiculoId, motorista, fecha, hora, kilometraje]
    );
    res.json(newEntryExit);
  } catch (error) {
    res.status(500).json({ error: "No se pudo registrar la salida." });
  }
});

// Ruta para obtener una lista de todas las entradas
app.get("/api/entradas/lista", async (req, res) => {
  try {
    const entries = await db.any("SELECT * FROM entradas");
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener las entradas." });
  }
});

// Ruta para obtener una lista de todas las salidas
app.get("/api/salidas/lista", async (req, res) => {
  try {
    const exits = await db.any("SELECT * FROM salidas");
    res.json(exits);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener las salidas." });
  }
});




// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});
