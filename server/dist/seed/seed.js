"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const User_js_1 = __importDefault(require("../models/User.js"));
const Category_js_1 = __importDefault(require("../models/Category.js"));
const Book_js_1 = __importDefault(require("../models/Book.js"));
const DEMO_ACCOUNTS = {
    admin: {
        name: 'Demo Admin',
        email: 'admin@starlearners.com',
        password: 'Admin@123',
        role: 'ADMIN',
        status: 'ACTIVE',
    },
    user: {
        name: 'Demo User',
        email: 'user@starlearners.com',
        password: 'User@123',
        role: 'USER',
        status: 'ACTIVE',
        phone: '9876543210',
    },
};
async function seed() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    // Clear existing data
    await User_js_1.default.deleteMany({});
    await Category_js_1.default.deleteMany({});
    await Book_js_1.default.deleteMany({});
    // Create demo accounts
    const [admin, user] = await User_js_1.default.create([DEMO_ACCOUNTS.admin, DEMO_ACCOUNTS.user]);
    console.log('Demo admin created:', admin.email);
    console.log('Demo user created:', user.email);
    // Create Categories
    const categories = await Category_js_1.default.insertMany([
        { name: 'Storybooks', slug: 'storybooks', iconEmoji: '📖' },
        { name: 'Educational', slug: 'educational', iconEmoji: '🔢' },
        { name: 'Puzzles', slug: 'puzzles', iconEmoji: '🧩' },
        { name: 'Activity Books', slug: 'activity-books', iconEmoji: '🎨' },
        { name: 'Animal Books', slug: 'animal-books', iconEmoji: '🦁' },
        { name: 'Science & Nature', slug: 'science-nature', iconEmoji: '🌍' },
    ]);
    console.log('Categories created:', categories.length);
    const catMap = new Map(categories.map((c) => [c.slug, c._id]));
    // Create 12 Sample Books
    const books = await Book_js_1.default.insertMany([
        {
            title: 'The Magic Treehouse',
            description: 'A wonderful adventure story about two siblings who discover a magical treehouse that takes them to different times and places.',
            coverImage: 'https://placehold.co/300x400?text=Magic+Treehouse',
            ageGroupMin: 6, ageGroupMax: 8,
            categoryId: catMap.get('storybooks'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 3,
        },
        {
            title: 'Counting with Animals',
            description: 'Learn to count from 1 to 100 with adorable animal friends. Perfect for early learners!',
            coverImage: 'https://placehold.co/300x400?text=Counting+Animals',
            ageGroupMin: 2, ageGroupMax: 4,
            categoryId: catMap.get('educational'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 2,
        },
        {
            title: 'Brain Teasers for Kids',
            description: 'A collection of fun puzzles and brain teasers designed to challenge young minds.',
            coverImage: 'https://placehold.co/300x400?text=Brain+Teasers',
            ageGroupMin: 8, ageGroupMax: 12,
            categoryId: catMap.get('puzzles'),
            planAccess: ['PREMIUM'], totalCopies: 2,
        },
        {
            title: 'Color & Create',
            description: 'An engaging activity book filled with coloring pages, mazes, and creative exercises.',
            coverImage: 'https://placehold.co/300x400?text=Color+Create',
            ageGroupMin: 4, ageGroupMax: 6,
            categoryId: catMap.get('activity-books'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 4,
        },
        {
            title: 'Safari Adventures',
            description: 'Explore the African savanna and learn about lions, elephants, giraffes, and more!',
            coverImage: 'https://placehold.co/300x400?text=Safari+Adventures',
            ageGroupMin: 4, ageGroupMax: 8,
            categoryId: catMap.get('animal-books'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 2,
        },
        {
            title: 'My First Science Book',
            description: 'Simple experiments and fascinating facts about the world around us.',
            coverImage: 'https://placehold.co/300x400?text=First+Science',
            ageGroupMin: 6, ageGroupMax: 8,
            categoryId: catMap.get('science-nature'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 3,
        },
        {
            title: 'Princess & The Dragon',
            description: 'A modern fairy tale about a brave princess who befriends a lonely dragon.',
            coverImage: 'https://placehold.co/300x400?text=Princess+Dragon',
            ageGroupMin: 4, ageGroupMax: 6,
            categoryId: catMap.get('storybooks'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 2,
        },
        {
            title: 'ABC Phonics Fun',
            description: 'Master the alphabet and phonics with interactive exercises and catchy rhymes.',
            coverImage: 'https://placehold.co/300x400?text=ABC+Phonics',
            ageGroupMin: 2, ageGroupMax: 4,
            categoryId: catMap.get('educational'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 3,
        },
        {
            title: 'Ultimate Puzzle Challenge',
            description: 'Advanced puzzles including sudoku, crosswords, and logic puzzles for older kids.',
            coverImage: 'https://placehold.co/300x400?text=Puzzle+Challenge',
            ageGroupMin: 8, ageGroupMax: 12,
            categoryId: catMap.get('puzzles'),
            planAccess: ['PREMIUM'], totalCopies: 1,
        },
        {
            title: 'Ocean Creatures',
            description: 'Dive deep into the ocean and discover amazing sea creatures from tiny seahorses to giant whales.',
            coverImage: 'https://placehold.co/300x400?text=Ocean+Creatures',
            ageGroupMin: 4, ageGroupMax: 8,
            categoryId: catMap.get('animal-books'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 2,
        },
        {
            title: 'Space Explorers',
            description: 'Blast off into space and learn about planets, stars, and the mysteries of the universe.',
            coverImage: 'https://placehold.co/300x400?text=Space+Explorers',
            ageGroupMin: 6, ageGroupMax: 12,
            categoryId: catMap.get('science-nature'),
            planAccess: ['PREMIUM'], totalCopies: 2,
        },
        {
            title: 'Craft & Play',
            description: 'Step-by-step craft projects using everyday materials. Hours of creative fun!',
            coverImage: 'https://placehold.co/300x400?text=Craft+Play',
            ageGroupMin: 4, ageGroupMax: 8,
            categoryId: catMap.get('activity-books'),
            planAccess: ['NORMAL', 'PREMIUM'], totalCopies: 3,
        },
    ]);
    console.log('Books created:', books.length);
    console.log('Seed completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin -> email: admin@starlearners.com | password: Admin@123');
    console.log('User  -> email: user@starlearners.com  | password: User@123');
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map