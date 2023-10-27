const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 4000; 
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

// Ruta para actualizar una salida
app.put("/api/salidas/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { placa, nombre_motorista, fecha, hora, kilometraje } = req.body;
  try {
    await db.one(
      "UPDATE salidas SET nombre_motorista=$1, fecha=$2, hora=$3, kilometraje=$4 placa=$5 WHERE id=$6 RETURNING *",
      [nombre_motorista, fecha, hora, kilometraje,placa, id]
    );
    res.json({ message: "Salida eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar la salida." });
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

// Ruta para actualizar una entrada
app.put("/api/entradas/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { placa, nombre_motorista, fecha, hora, kilometraje } = req.body;
  try {
    const updatedEntry = await db.one(
      "UPDATE entradas SET nombre_motorista=$1, fecha=$2, hora=$3, kilometraje=$4, placa=$5 WHERE id=$6 RETURNING *",
      [nombre_motorista, fecha, hora, kilometraje, placa, id]
    );
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar la entrada." });
  }
});

// Ruta para eliminar una entrada
app.delete("/api/entradas/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.none("DELETE FROM entradas WHERE id=$1", [id]);
    res.json({ message: "Entrada eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar la entrada." });
  }
});

// Ruta para eliminar una salida
app.delete("/api/salidas/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.none("DELETE FROM salidas WHERE id=$1", [id]);
    res.json({ message: "Salida eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar la salida." });
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
  const { placa, nombre_motorista, fecha, hora, kilometraje } = req.body;
  try {
    const newEntryExit = await db.one(
      "INSERT INTO entradas(nombre_motorista, fecha, hora, kilometraje, placa) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [nombre_motorista, fecha, hora, kilometraje, placa]
    );
    res.json(newEntryExit);
    // console.log('Nueva Entrada: ', newEntryExit)
  } catch (error) {
    res.status(200).json({ error: "No se pudo registrar la entrada." });
  }
});


// Ruta para registrar una entrada de un vehículo
app.post("/api/salidas", async (req, res) => {
  const { placa, nombre_motorista, fecha, hora, kilometraje } = req.body;
  try {
    const newExit = await db.one(
      "INSERT INTO salidas(nombre_motorista, fecha, hora, kilometraje, placa) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [nombre_motorista, fecha, hora, kilometraje, placa]
    );
    res.json(newExit);
    console.log('Nueva Entrada: ', newExit)
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
