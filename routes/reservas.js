const express = require('express');
const Reserva = require('../models/Reserva');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protege todas las rutas siguientes con autenticación
router.use(authMiddleware);

// Listar todas las reservas del usuario autenticado
router.get('/', async (req, res) => {
  const reservas = await Reserva.find({ usuario: req.userId });
  res.json(reservas);
});

// Crear nueva reserva
router.post('/', async (req, res) => {
  const { fecha, sala, hora } = req.body;

 

   // --- INICIO DE MODIFICACIONES ---

  // Cambio 1: Validar el formato de la hora (12 horas AM/PM)
  // Se utiliza una expresión regular para validar el formato "HH:MM AM/PM"
  const formatoHoraRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  if (!hora || !formatoHoraRegex.test(hora)) {
    return res.status(400).json({ msg: 'Formato de hora inválido. Use el formato de 12 horas (ej: 03:30 PM).' });
  }

  // Cambio 2: Validar que no se reserve en domingo
  // Se asume que la fecha llega en formato 'YYYY-MM-DD' para que Date() la interprete correctamente.
  // El método getUTCDay() devuelve 0 para domingo.
  const diaDeLaSemana = new Date(fecha).getUTCDay();
  if (diaDeLaSemana === 0) {
    return res.status(400).json({ msg: 'No se permiten reservas los domingos.' });
  }




  //nueva implentacion
  //verificar que sea obligatorio
  //control de reserva obligatorio y con valores especificos
  if (!sala || !["A","B","C"].includes(sala)) {
    return res.status(400).json({ msg: 'Sala inválida o no proporcionada. Solo se aceptan A, B o C.' });
  }

  const nueva = new Reserva({
    usuario: req.userId,
    fecha,
    sala,
    hora
  });


  await nueva.save();
  res.status(201).json(nueva);
});

// Eliminar una reserva (solo si pertenece al usuario)
router.delete('/:id', async (req, res) => {
  const resultado = await Reserva.deleteOne({ _id: req.params.id, usuario: req.userId });
  
  //si no se elimino niguna reserva (porque no era suya o no existia)
  if (resultado.deletedCount === 0) {
    return res.status(404).json({ msg: 'Reserva no encontrada o no pertenece al usuario' });
  }


  res.json({ msg: 'Reserva cancelada' });
});

module.exports = router;