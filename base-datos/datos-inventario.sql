-- GA8: da inventario inicial (20 unidades) a los productos que todavía no tienen fila en inventario.
-- Sin inventario el catálogo los muestra como "Agotado" y no se pueden pedir.
USE everbloom;
INSERT INTO inventario (id_producto, cantidad)
SELECT p.id_producto, 20
FROM productos p
WHERE NOT EXISTS (SELECT 1 FROM inventario i WHERE i.id_producto = p.id_producto);
