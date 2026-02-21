import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: "Remera Basica Blanca",
      description: "Remera de algodon premium para uso diario.",
      price: "39.90",
      stock: 25,
      category: "Indumentaria",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"
    },
    {
      name: "Zapatillas Urban Street",
      description: "Zapatillas urbanas con suela de alta durabilidad.",
      price: "89.50",
      stock: 15,
      category: "Calzado",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    },
    {
      name: "Mochila Tech 20L",
      description: "Mochila con compartimento para notebook y accesorios.",
      price: "67.30",
      stock: 18,
      category: "Accesorios",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"
    },
    {
      name: "Auriculares Bluetooth Pro",
      description: "Audio inmersivo con bateria de larga duracion.",
      price: "94.80",
      stock: 12,
      category: "Electronica",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
    }
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl,
          isActive: true
        }
      });
      continue;
    }

    await prisma.product.create({
      data: {
        ...product,
        isActive: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
