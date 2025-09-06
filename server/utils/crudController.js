// utils/crudController.js

exports.createItem = (Model) => async (req, res) => {
  try {
    const item = new Model(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear", error: error.message });
  }
};

exports.getAllItems = (Model) => async (_req, res) => {
  try {
    const items = await Model.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener datos" });
  }
};

exports.updateItem = (Model) => async (req, res) => {
  try {
    const updated = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar", error: error.message });
  }
};

exports.deleteItem = (Model) => async (req, res) => {
  try {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar", error: error.message });
  }
};
