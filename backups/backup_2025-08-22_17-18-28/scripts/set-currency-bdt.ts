import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const result = await prisma.product.updateMany({
		data: { currency: "BDT" },
	});
	console.log(`Updated currency to BDT for ${result.count} products.`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
		process.exit(0);
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});


