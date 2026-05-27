import type { Land } from '../types';

// Curated list of major attractions per WDW park.
// Ride IDs are stable so starred/visited state survives data updates.
const ATTRACTIONS: Record<number, Land[]> = {
  // Magic Kingdom
  6: [
    {
      id: 1,
      name: 'Adventureland',
      rides: [
        { id: 6101, name: 'Jungle Cruise' },
        { id: 6102, name: 'Pirates of the Caribbean' },
        { id: 6103, name: 'The Magic Carpets of Aladdin' },
        { id: 6104, name: 'Swiss Family Treehouse' },
        { id: 6105, name: "Tiana's Bayou Adventure" },
      ],
    },
    {
      id: 2,
      name: 'Frontierland',
      rides: [
        { id: 6201, name: 'Big Thunder Mountain Railroad' },
        { id: 6202, name: 'Country Bear Musical Jamboree' },
        { id: 6203, name: 'Tom Sawyer Island' },
      ],
    },
    {
      id: 3,
      name: 'Liberty Square',
      rides: [
        { id: 6301, name: 'Haunted Mansion' },
        { id: 6302, name: 'Liberty Square Riverboat' },
        { id: 6303, name: 'The Hall of Presidents' },
      ],
    },
    {
      id: 4,
      name: 'Fantasyland',
      rides: [
        { id: 6401, name: "it's a small world" },
        { id: 6402, name: "Peter Pan's Flight" },
        { id: 6403, name: "Mickey's PhilharMagic" },
        { id: 6404, name: 'Mad Tea Party' },
        { id: 6405, name: 'Prince Charming Regal Carrousel' },
        { id: 6406, name: 'Dumbo the Flying Elephant' },
        { id: 6407, name: 'The Many Adventures of Winnie the Pooh' },
        { id: 6408, name: 'Seven Dwarfs Mine Train' },
        { id: 6409, name: 'Under the Sea ~ Journey of The Little Mermaid' },
      ],
    },
    {
      id: 5,
      name: 'Tomorrowland',
      rides: [
        { id: 6501, name: 'Space Mountain' },
        { id: 6502, name: 'Tomorrowland Speedway' },
        { id: 6503, name: 'Tomorrowland Transit Authority PeopleMover' },
        { id: 6504, name: 'Astro Orbiter' },
        { id: 6505, name: "Buzz Lightyear's Space Ranger Spin" },
        { id: 6506, name: 'Carousel of Progress' },
        { id: 6507, name: 'Monsters, Inc. Laugh Floor' },
        { id: 6508, name: 'TRON Lightcycle / Run' },
      ],
    },
  ],

  // EPCOT
  5: [
    {
      id: 1,
      name: 'World Celebration',
      rides: [
        { id: 5101, name: 'Spaceship Earth' },
        { id: 5102, name: 'Journey Into Imagination With Figment' },
      ],
    },
    {
      id: 2,
      name: 'World Discovery',
      rides: [
        { id: 5201, name: 'Test Track' },
        { id: 5202, name: 'Mission: SPACE' },
        { id: 5203, name: 'Guardians of the Galaxy: Cosmic Rewind' },
      ],
    },
    {
      id: 3,
      name: 'World Nature',
      rides: [
        { id: 5301, name: "Soarin' Around the World" },
        { id: 5302, name: 'Living with the Land' },
        { id: 5303, name: 'The Seas with Nemo & Friends' },
        { id: 5304, name: 'Turtle Talk with Crush' },
      ],
    },
    {
      id: 4,
      name: 'World Showcase',
      rides: [
        { id: 5401, name: 'Frozen Ever After' },
        { id: 5402, name: 'Gran Fiesta Tour Starring The Three Caballeros' },
        { id: 5403, name: "Remy's Ratatouille Adventure" },
      ],
    },
  ],

  // Hollywood Studios
  7: [
    {
      id: 1,
      name: 'Sunset Boulevard',
      rides: [
        { id: 7101, name: 'The Twilight Zone Tower of Terror' },
        { id: 7102, name: "Rock 'n' Roller Coaster Starring Aerosmith" },
      ],
    },
    {
      id: 2,
      name: 'Echo Lake',
      rides: [
        { id: 7201, name: 'Star Tours – The Adventures Continue' },
        { id: 7202, name: 'Indiana Jones Epic Stunt Spectacular!' },
      ],
    },
    {
      id: 3,
      name: 'Grand Avenue',
      rides: [{ id: 7301, name: 'Muppet*Vision 3D' }],
    },
    {
      id: 4,
      name: 'Toy Story Land',
      rides: [
        { id: 7401, name: 'Slinky Dog Dash' },
        { id: 7402, name: 'Toy Story Mania!' },
        { id: 7403, name: 'Alien Swirling Saucers' },
      ],
    },
    {
      id: 5,
      name: "Star Wars: Galaxy's Edge",
      rides: [
        { id: 7501, name: 'Millennium Falcon: Smugglers Run' },
        { id: 7502, name: 'Star Wars: Rise of the Resistance' },
      ],
    },
    {
      id: 6,
      name: 'Mickey Avenue',
      rides: [{ id: 7601, name: "Mickey & Minnie's Runaway Railway" }],
    },
    {
      id: 7,
      name: 'Animation Courtyard',
      rides: [
        { id: 7701, name: 'Walt Disney Presents' },
        { id: 7702, name: 'Disney Junior Play & Dance!' },
      ],
    },
  ],

  // Animal Kingdom
  8: [
    {
      id: 1,
      name: 'Pandora – The World of Avatar',
      rides: [
        { id: 8101, name: 'Avatar Flight of Passage' },
        { id: 8102, name: "Na'vi River Journey" },
      ],
    },
    {
      id: 2,
      name: 'Africa',
      rides: [
        { id: 8201, name: 'Kilimanjaro Safaris' },
        { id: 8202, name: 'Festival of the Lion King' },
      ],
    },
    {
      id: 3,
      name: 'Asia',
      rides: [
        { id: 8301, name: 'Expedition Everest' },
        { id: 8302, name: 'Kali River Rapids' },
        { id: 8303, name: 'Feathered Friends in Flight!' },
      ],
    },
    {
      id: 4,
      name: 'DinoLand U.S.A.',
      rides: [
        { id: 8401, name: 'DINOSAUR' },
        { id: 8402, name: 'TriceraTop Spin' },
      ],
    },
    {
      id: 5,
      name: 'Discovery Island',
      rides: [{ id: 8501, name: 'Adventurers Outpost' }],
    },
    {
      id: 6,
      name: "Rafiki's Planet Watch",
      rides: [{ id: 8601, name: 'Conservation Station' }],
    },
  ],
};

export function getAttractions(parkId: number): Land[] {
  return ATTRACTIONS[parkId] ?? [];
}
