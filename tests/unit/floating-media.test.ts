import {describe,it,expect} from 'vitest';
import {controllableYouTubeURL,videoOutsideViewport} from '@/components/ui/youtube-player';
describe('floating video boundaries',()=>{
 it('floats only once the original video leaves the viewport',()=>{expect(videoOutsideViewport({top:-300,bottom:1},800)).toBe(false);expect(videoOutsideViewport({top:-300,bottom:0},800)).toBe(true);expect(videoOutsideViewport({top:800,bottom:1000},800)).toBe(true);});
 it('uses official API controls while preserving approved playback bounds',()=>{const url=new URL(controllableYouTubeURL('https://www.youtube-nocookie.com/embed/abcdefghijk?start=30&end=240','http://localhost:3000')!);expect(url.searchParams.get('start')).toBe('30');expect(url.searchParams.get('end')).toBe('240');expect(url.searchParams.get('enablejsapi')).toBe('1');expect(url.searchParams.get('origin')).toBe('http://localhost:3000');});
 it('leaves unrelated and misleading iframe domains alone',()=>{expect(controllableYouTubeURL('https://youtube.com.attacker.test/embed/abc','http://localhost:3000')).toBeNull();expect(controllableYouTubeURL('/workplace-tour/scene.html','http://localhost:3000')).toBeNull();});
});
