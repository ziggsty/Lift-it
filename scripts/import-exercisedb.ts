import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gscqhrruuuxkrgbaoajl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com';

// Interface matching the Supabase public.exercises schema
interface SupabaseExercise {
  id: string;
  name: string;
  body_part: string;
  target: string;
  equipment: string;
  gif_url?: string;
  instructions: string[] | any;
}

// Built-in verified exercise catalog for immediate seeding or RapidAPI fallback
const VERIFIED_EXERCISES_CATALOG: SupabaseExercise[] = [
  // Chest
  {
    id: 'ex_0001',
    name: 'Barbell Bench Press',
    body_part: 'chest',
    target: 'pectorals',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Lie flat on the bench with your eyes directly under the barbell.',
      'Grip the bar slightly wider than shoulder-width with wrists straight.',
      'Unrack the bar and stabilize it directly over your chest with arms locked.',
      'Inhale and lower the bar slowly to touch your mid-chest.',
      'Drive your feet into the floor and press the bar back to the starting lockout position.',
    ],
  },
  {
    id: 'ex_0002',
    name: 'Incline Dumbbell Press',
    body_part: 'chest',
    target: 'upper pectorals',
    equipment: 'dumbbell',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Set an incline bench to approximately 30 to 45 degrees.',
      'Sit back holding dumbbells at chest level with palms facing forward.',
      'Press the dumbbells up until your arms are fully extended over upper chest.',
      'Lower the dumbbells slowly until you feel a comfortable stretch in your pecs.',
      'Repeat for the target rep range.',
    ],
  },
  {
    id: 'ex_0003',
    name: 'Cable Chest Fly',
    body_part: 'chest',
    target: 'pectorals',
    equipment: 'cable',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Attach D-handles to the high pulleys of a dual-cable station.',
      'Step forward into a staggered stance with a slight forward lean.',
      'With a slight bend in your elbows, pull the handles together in a hugging motion.',
      'Squeeze your chest hard at the contraction point for one second.',
      'Slowly reverse the motion until your chest feels stretched.',
    ],
  },
  // Back
  {
    id: 'ex_0004',
    name: 'Barbell Conventional Deadlift',
    body_part: 'back',
    target: 'erector spinae',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Stand with feet hip-width apart and the barbell over mid-foot.',
      'Hinge at the hips and grip the barbell just outside your shins.',
      'Pull your chest up, retract your lats, and pull the slack out of the barbell.',
      'Drive the floor away with your legs, keeping the bar close to your body.',
      'Lock out at hips and knees, then hinge hips to guide the weight back down.',
    ],
  },
  {
    id: 'ex_0005',
    name: 'Barbell Bent Over Row',
    body_part: 'back',
    target: 'upper back',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Hinge forward at the hips at a 45-degree angle with a flat spine.',
      'Grip the barbell overhand slightly wider than shoulder-width.',
      'Pull the bar smoothly to your lower ribcage, driving with your elbows.',
      'Squeeze your shoulder blades together at the top of the movement.',
      'Lower under control to a full stretch before the next repetition.',
    ],
  },
  {
    id: 'ex_0006',
    name: 'Wide-Grip Lat Pulldown',
    body_part: 'back',
    target: 'latissimus dorsi',
    equipment: 'cable',
    gif_url: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Sit comfortably with thigh pads snugly secured over your knees.',
      'Grip the wide lat pulldown bar with an overhand grip.',
      'Lean back slightly (10-15 degrees) and pull the bar down toward your upper chest.',
      'Focus on driving your elbows down and backward into your sides.',
      'Resist the weight back upward until arms are fully extended and lats are stretched.',
    ],
  },
  {
    id: 'ex_0007',
    name: 'Pull-Up',
    body_part: 'back',
    target: 'latissimus dorsi',
    equipment: 'body weight',
    gif_url: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Hang from an overhead pull-up bar with an overhand grip wider than shoulders.',
      'Initiate the pull by retracting your scapulae down and back.',
      'Pull yourself upward until your chin clears the bar.',
      'Pause briefly, then lower yourself slowly to a complete dead hang.',
    ],
  },
  // Legs
  {
    id: 'ex_0008',
    name: 'Barbell Back Squat',
    body_part: 'legs',
    target: 'quadriceps',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Place barbell across your upper traps and step back from the rack.',
      'Set feet shoulder-width apart with toes pointed slightly outward.',
      'Inhale, brace your core deeply, and descend by breaking at hips and knees.',
      'Squat down until hip crease is below knee level (parallel or deeper).',
      'Push forcefully through your mid-foot and stand back up to starting lockout.',
    ],
  },
  {
    id: 'ex_0009',
    name: 'Romanian Deadlift (RDL)',
    body_part: 'legs',
    target: 'hamstrings',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Stand holding a barbell at hip level with a slight bend in your knees.',
      'Push your hips backward as if trying to touch the wall behind you.',
      'Lower the bar along your shins until you feel a deep stretch in your hamstrings.',
      'Keep your back flat and neutral throughout the entire descent.',
      'Drive hips forward and contract glutes to return to standing position.',
    ],
  },
  {
    id: 'ex_0010',
    name: 'Leg Press',
    body_part: 'legs',
    target: 'quadriceps',
    equipment: 'machine',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Sit on the 45-degree leg press with feet shoulder-width on the platform.',
      'Disengage the safety handles and lower the platform until knees are at 90 degrees.',
      'Press through whole feet to push the sled back up without locking your knees.',
      'Perform for designated repetitions and re-engage safety catch.',
    ],
  },
  {
    id: 'ex_0011',
    name: 'Standing Calf Raise',
    body_part: 'legs',
    target: 'calves',
    equipment: 'machine',
    gif_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Place the balls of your feet on the step and rest shoulders under the pads.',
      'Lower your heels as far as comfortable to achieve a deep calf stretch.',
      'Explode upward onto your toes, contracting the calves at the top.',
      'Hold the peak contraction for 1 second before lowering down under control.',
    ],
  },
  // Shoulders
  {
    id: 'ex_0012',
    name: 'Overhead Barbell Military Press',
    body_part: 'shoulders',
    target: 'anterior deltoids',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Stand tall with feet hip-width apart holding the barbell at clavicle height.',
      'Brace your glutes, abs, and thighs to establish a rigid foundation.',
      'Press the bar straight upward, tucking your chin briefly to clear the bar path.',
      'Push your head forward slightly at the top lockout directly overhead.',
      'Lower the bar back to your collarbone in a controlled tempo.',
    ],
  },
  {
    id: 'ex_0013',
    name: 'Dumbbell Lateral Raise',
    body_part: 'shoulders',
    target: 'lateral deltoids',
    equipment: 'dumbbell',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Stand holding dumbbells at your sides with a slight forward torso lean.',
      'Raise the dumbbells outward to the sides leading with your elbows.',
      'Stop when dumbbells reach shoulder height with palms facing down.',
      'Lower smoothly to the starting position without swinging or using momentum.',
    ],
  },
  {
    id: 'ex_0014',
    name: 'Face Pull',
    body_part: 'shoulders',
    target: 'posterior deltoids',
    equipment: 'cable',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Attach a rope to the cable pulley set at eye level.',
      'Grip the rope ends with thumbs pointing backward.',
      'Step back, pull the rope towards your face, pulling the ends apart.',
      'Externally rotate your shoulders at the end of the pull, squeezing rear delts.',
      'Return slowly to the starting position.',
    ],
  },
  // Arms
  {
    id: 'ex_0015',
    name: 'Barbell Bicep Curl',
    body_part: 'arms',
    target: 'biceps',
    equipment: 'barbell',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Stand holding an EZ-bar or straight barbell with an underhand grip.',
      'Keep your elbows pinned close to your torso.',
      'Curl the bar upward while contracting your biceps.',
      'Pause and squeeze at the top of the movement.',
      'Lower the bar under control back to the starting stretch position.',
    ],
  },
  {
    id: 'ex_0016',
    name: 'Cable Tricep Pushdown',
    body_part: 'arms',
    target: 'triceps',
    equipment: 'cable',
    gif_url: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Attach a straight bar or rope to a high cable pulley.',
      'Keep your elbows tucked into your ribs and hinge forward slightly.',
      'Push the handle down by extending your elbows until arms are fully locked.',
      'Squeeze your triceps hard at the bottom.',
      'Slowly allow the cable to raise your forearms back to 90 degrees.',
    ],
  },
  {
    id: 'ex_0017',
    name: 'Dumbbell Hammer Curl',
    body_part: 'arms',
    target: 'brachialis',
    equipment: 'dumbbell',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Hold dumbbells with a neutral grip (palms facing each other).',
      'Curl the weights upward without rotating your wrists.',
      'Squeeze the brachialis and forearm muscles at peak contraction.',
      'Lower under control to full extension.',
    ],
  },
  {
    id: 'ex_0018',
    name: 'Dips (Chest & Triceps)',
    body_part: 'arms',
    target: 'triceps',
    equipment: 'body weight',
    gif_url: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Grip the parallel dip bars and lift your body until arms are locked out.',
      'Lower your body by bending your elbows until they reach a 90-degree angle.',
      'Lean slightly forward to engage more chest, or stay upright for more triceps.',
      'Push through your palms to return to the starting position.',
    ],
  },
  // Core / Waist
  {
    id: 'ex_0019',
    name: 'Hanging Leg Raise',
    body_part: 'waist',
    target: 'abs',
    equipment: 'body weight',
    gif_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Hang from a pull-up bar with arms fully extended.',
      'Keep your legs straight or slightly bent and engage your lower abdominals.',
      'Raise your legs until they are parallel to the floor or higher.',
      'Lower slowly without swinging or using pendulum momentum.',
    ],
  },
  {
    id: 'ex_0020',
    name: 'Ab Roller Wheel Rollout',
    body_part: 'waist',
    target: 'abs',
    equipment: 'other',
    gif_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    instructions: [
      'Kneel on the floor holding the handles of the ab wheel directly beneath shoulders.',
      'Roll the wheel forward slowly, extending your body in a straight line.',
      'Go as far forward as possible without letting your lower back sag.',
      'Use your core to pull yourself back to the starting kneeling position.',
    ],
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runExerciseImport() {
  console.log('\n===============================================================');
  console.log('       🏋️  LIFT IT - EXERCISE DATABASE BULK IMPORTER  🏋️');
  console.log('===============================================================\n');

  console.log(`[Config] Supabase Target:  ${SUPABASE_URL}`);
  console.log(`[Config] RapidAPI Key:     ${RAPIDAPI_KEY ? 'CONFIGURED (' + RAPIDAPI_KEY.slice(0, 8) + '...)' : 'NOT FOUND (Seed/Offline mode available)'}`);
  console.log(`[Config] RapidAPI Host:    ${RAPIDAPI_HOST}`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  let seedOnly = false;
  let maxBatches = 5;
  let batchLimit = 50;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed') {
      seedOnly = true;
    } else if (args[i] === '--batches' && args[i + 1]) {
      maxBatches = parseInt(args[i + 1], 10) || 5;
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      batchLimit = parseInt(args[i + 1], 10) || 50;
      i++;
    }
  }

  // Initialize Supabase Client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify connection to public.exercises
  console.log('⏳ Connecting to Supabase and checking existing exercises table...');
  const { data: existingRows, error: checkError } = await supabase
    .from('exercises')
    .select('id, name')
    .limit(5000);

  if (checkError) {
    console.error('\n❌ Could not query exercises table:');
    console.error(`   Message: ${checkError.message}`);
    console.error(`   Details: ${checkError.details || 'Check table schema'}`);
    process.exit(1);
  }

  const existingIds = new Set<string>((existingRows || []).map((r) => r.id));
  const existingNames = new Set<string>((existingRows || []).map((r) => r.name.toLowerCase()));
  console.log(`✅ Connected! Currently ${existingIds.size} exercise(s) in Supabase database.\n`);

  let exercisesToInsert: SupabaseExercise[] = [];

  // If RapidAPI key is missing or user requested --seed, use verified catalog
  if (!RAPIDAPI_KEY || seedOnly) {
    console.log('📦 Using Verified Core Exercises Catalog (Compound & Isolation Staples)...');
    exercisesToInsert = VERIFIED_EXERCISES_CATALOG.filter(
      (ex) => !existingIds.has(ex.id) && !existingNames.has(ex.name.toLowerCase())
    );
  } else {
    console.log('🌐 Connecting to ExerciseDB via RapidAPI...');
    let offset = 0;
    let totalFetched = 0;

    for (let batch = 0; batch < maxBatches; batch++) {
      console.log(`   ⏳ Fetching batch ${batch + 1}/${maxBatches} (offset: ${offset}, limit: ${batchLimit})...`);
      const url = `https://${RAPIDAPI_HOST}/exercises?limit=${batchLimit}&offset=${offset}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          console.warn(`   ⚠️ RapidAPI responded with HTTP ${res.status}: ${res.statusText}`);
          if (res.status === 401 || res.status === 403) {
            console.warn('   ⚠️ Invalid or expired RapidAPI key. Falling back to verified catalog.');
            exercisesToInsert = VERIFIED_EXERCISES_CATALOG.filter(
              (ex) => !existingIds.has(ex.id) && !existingNames.has(ex.name.toLowerCase())
            );
            break;
          }
          break;
        }

        const data: any = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.log('   ℹ️ No more exercises returned from ExerciseDB.');
          break;
        }

        totalFetched += data.length;

        for (const item of data) {
          const id = String(item.id || '').trim();
          const name = String(item.name || '').trim();
          if (!id || !name) continue;

          if (existingIds.has(id) || existingNames.has(name.toLowerCase())) {
            continue;
          }

          exercisesToInsert.push({
            id: id,
            name: name,
            body_part: item.bodyPart || 'other',
            target: item.target || 'general',
            equipment: item.equipment || 'body weight',
            gif_url: item.gifUrl || '',
            instructions: Array.isArray(item.instructions)
              ? item.instructions
              : [item.instructions || 'Follow proper form.'],
          });

          existingIds.add(id);
          existingNames.add(name.toLowerCase());
        }

        offset += batchLimit;
        await sleep(500); // Respect RapidAPI rate limits
      } catch (err: any) {
        console.error(`   ❌ Failed to fetch from RapidAPI: ${err.message}`);
        console.log('   📦 Falling back to verified catalog for this run.');
        exercisesToInsert = VERIFIED_EXERCISES_CATALOG.filter(
          (ex) => !existingIds.has(ex.id) && !existingNames.has(ex.name.toLowerCase())
        );
        break;
      }
    }

    console.log(`   Fetched ${totalFetched} raw records from ExerciseDB.`);
  }

  if (exercisesToInsert.length === 0) {
    console.log('\n✨ All target exercises already exist in your Supabase exercises table!');
    console.log(`Total exercises available: ${existingIds.size}\n`);
    process.exit(0);
  }

  console.log(`\n⏳ Inserting ${exercisesToInsert.length} new exercise(s) into Supabase...`);

  // Insert in chunks of 50 to avoid request size limits
  const CHUNK_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < exercisesToInsert.length; i += CHUNK_SIZE) {
    const chunk = exercisesToInsert.slice(i, i + CHUNK_SIZE);
    const { data: inserted, error: insertError } = await supabase
      .from('exercises')
      .upsert(chunk, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.error(`❌ Failed to insert chunk starting at index ${i}:`, insertError.message);
    } else {
      insertedCount += (inserted || []).length;
      console.log(`   ✅ Inserted batch: ${insertedCount}/${exercisesToInsert.length} exercises.`);
    }
  }

  // Summary
  console.log('\n===============================================================');
  console.log('                 📊  IMPORT SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`New Exercises Added:    ${insertedCount}`);
  console.log(`Total Exercises In DB:  ${existingIds.size + insertedCount}`);
  console.log('===============================================================\n');
  console.log('🎉 Exercise database import completed successfully!\n');
  process.exit(0);
}

runExerciseImport().catch((err) => {
  console.error('\n💥 Fatal ExerciseDB import error:', err);
  process.exit(1);
});
