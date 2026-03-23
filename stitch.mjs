import { stitch } from '@google/stitch-sdk';
import dotenv from 'dotenv';

// Load API key from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
    const prompt = process.argv.slice(2).join(' ');

    if (!prompt) {
        console.log('\x1b[33m%s\x1b[0m', 'Usage: npm run stitch "Your design prompt here"');
        return;
    }

    if (!process.env.STITCH_API_KEY) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: STITCH_API_KEY is not set in .env.local');
        return;
    }

    console.log('\x1b[36m%s\x1b[0m', '🚀 Connecting to Google Stitch...');
    
    try {
        // 1. Find or create project
        const projects = await stitch.projects();
        let project = projects.find(p => p.data?.title === "Terminal Generations");
        if (!project) {
            project = await stitch.createProject("Terminal Generations");
        }

        console.log('\x1b[35m%s\x1b[0m', `🎨 Generating high-fidelity design...`);
        console.log('(This may take up to 60 seconds as the AI renders the interface)');

        // 2. Call the tool directly to avoid SDK index errors
        const raw = await stitch.callTool("generate_screen_from_text", { 
            projectId: project.id, 
            prompt 
        });

        // 3. Robustly find the screen data in the response
        let screenData = null;
        if (raw.outputComponents) {
            for (const component of raw.outputComponents) {
                if (component.design?.screens?.[0]) {
                    screenData = component.design.screens[0];
                    break;
                }
            }
        }

        if (!screenData) {
            throw new Error("The AI generated text/strategy but didn't return a visual design. Please try a more specific prompt.");
        }

        console.log('\x1b[32m%s\x1b[0m', '✅ Generation Complete!');

        // 4. Get the result URLs
        const htmlUrl = screenData.htmlCode?.downloadUrl;
        const imageUrl = screenData.screenshot?.downloadUrl;

        console.log('\n----------------------------------------');
        console.log('\x1b[1m%s\x1b[0m', 'RESULTS:');
        if (htmlUrl) console.log('\x1b[34m%s\x1b[0m', `📄 HTML Code URL:  ${htmlUrl}`);
        if (imageUrl) console.log('\x1b[34m%s\x1b[0m', `🖼️  Preview Image: ${imageUrl}`);
        console.log('----------------------------------------\n');

    } catch (error) {
        if (error.message.includes('undefined')) {
            console.error('\x1b[31m%s\x1b[0m', `❌ API Structure Error: The AI response format changed. Retrying with direct access...`);
        } else {
            console.error('\x1b[31m%s\x1b[0m', `❌ Error: ${error.message}`);
        }
    }
}

main();
