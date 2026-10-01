"""Original launch-film scene. Blender consumes absolute poses produced by the SDK.
Run: blender -b --python examples/launch-film/scene.py -- --stills
Use --render for all 600 frames. Re-run resumes completed PNGs; clear build/frames after edits.
"""
import bpy, math, json, sys, time
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
DATA=json.loads((ROOT/'build/poses.json').read_text())
BUILD=ROOT/'build';(BUILD/'frames').mkdir(parents=True,exist_ok=True);(BUILD/'stills').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=64
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.fps=30
scene.world.color=(.13,.13,.13)
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.5
scene.render.use_persistent_data=True
def color(h):
    return tuple(((int(h[i:i+2],16)/255+.055)/1.055)**2.4 if int(h[i:i+2],16)/255>.04045 else int(h[i:i+2],16)/3294.6 for i in (0,2,4))+(1,)
def mat(name,h,metal=0,rough=.4):
    m=bpy.data.materials.new(name);m.diffuse_color=color(h);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=color(h);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
    return m
ink=mat('Midnight enamel','18343c',.3,.26);paper=mat('Warm paper','f0eada',0,.65);coral=mat('Vermilion','f25b3c',.2,.29)
silver=mat('Satin aluminium','b4c2c1',.8,.3);dark=mat('Basalt','18262b',.1,.5);mint=mat('Sea-glass enamel','82b4aa',.15,.33)
def box(name,loc,dim,material,r=.08):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if r:
        m=o.modifiers.new('Machined radius','BEVEL');m.width=r;m.segments=4
        m=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def text(name,body,loc,size,material,rotation=(0,0,0)):
    cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.extrude=.001;cu.align_x='CENTER'
    o=bpy.data.objects.new(name,cu);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;cu.materials.append(material);return o
def area(name,loc,target,power,size,tint):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color(tint)[:3]
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
floor=box('Infinite studio',(0,12,-.35),(2000,2000,.5),paper,.01)
area('Large warm key',(-6,-2,11),(0,8,1),2300,10,'fff2de')
area('Long cool fill',(6,13,10),(0,12,2),2900,12,'cfedff')
area('Assembly softbox',(-4,22,12),(0,20,2),3200,9,'ffffff')
area('Back edge',(0,27,7),(0,20,2),2000,7,'ffe0c5')
guide=box('EL01 - the subject',(0,0,.72),(1.5,1.0,.16),coral,.14)
guide_marks=[]
for x in [-.42,-.22,0,.22,.42]:
    o=box('Subject signature', (x,0,.817),(.055,.45,.015),paper,.015);o.parent=guide;o.location=(x,0,.097);guide_marks.append(o)
pages=[]
for i in range(7):
    x=(i%3-1)*1.8;y=(i//3-1)*1.45
    o=box('Design sheet %02d'%i,(x,y,.3+i*.035),(1.5,1.05,.055),paper if i%2 else mint,.04)
    bars=[]
    for j in range(3):
        b=box('Printed rhythm', (0,0,0),(.65-j*.15,.035,.005),ink,.002);b.parent=o;b.location=(-.12,.27-j*.18,.031);bars.append(b)
    pages.append((o,Vector((x,y,.3+i*.035))))
base=box('Intro plinth',(0,0,.01),(7,5,.35),ink,.2)
portals=[]
for i in range(5):
    y=4+i*3.3; palette=[ink,mint,paper,coral,ink][i]
    objects=[box('Portal left',(-2.3,y,2.3),(.28,.3,4.6),palette),box('Portal right',(2.3,y,2.3),(.28,.3,4.6),palette),box('Portal crown',(0,y,4.6),(4.9,.3,.28),palette)]
    portals.extend(objects)
    for j in range(4):
        box('Depth marker',(3+j*.3,y,.03),(.12,1.8,.06),silver,.02)
assembly=[]
for i in range(5):
    z=.5+i*.38
    o=box(['Foundation','Subject layer','Camera layer','Sound layer','Asset layer'][i],(0,20,z),(5.5-i*.2,3.5-i*.12,.24),[ink,silver,paper,mint,ink][i],.18)
    label=text('Layer identifier',f'0{i+1}   '+['STORY','SUBJECT','CAMERA','SOUND','ASSETS'][i],(0,18.3+i*.06,z),.22,paper if i in [0,4] else ink,(math.pi/2,0,0));label.parent=o;label.location=(0,-(3.5-i*.12)/2-.005,0)
    assembly.append((o,z))
    for x in [-2.25,2.25]:
        for y in [-1.2,1.2]:
            bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.09,depth=.265,location=(0,0,0));s=bpy.context.object;s.data.materials.append(silver);s.parent=o;s.location=(x*(1-i*.04),y,0)
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.clip_end=300
cam.data.dof.use_dof=True;cam.data.dof.aperture_fstop=7
def state(d):
    t=d['time'];guide.location=d['subject'];guide.rotation_euler=(.16*math.sin(t)*min(1,max(0,t-3))*(1-d['assembly']),.24*math.sin(t*.9)*(1-d['assembly']),.08*math.sin(t*2)*(1-d['assembly']))
    guide.location.z+=d['explode']*4*.83
    for i,o in enumerate(portals):o.location.z=(4.6 if i%3==2 else 2.3)-min(1,max(0,(t-11.1)/1.1))*6
    for i,(o,start) in enumerate(pages):
        u=max(0,min(1,(t-.15*i)/2));u=u*u*(3-2*u)
        end=Vector((0,0,.3+i*.055));o.location=start.lerp(end,u)
        gone=max(0,min(1,(t-3.8)/.8));o.scale=(1-gone*.999,)*3
    for i,(o,z) in enumerate(assembly):o.location.z=z+d['explode']*i*.83
    p=d['camera'];cam.location=p['position'];target=Vector(p['target'])
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=36/(2*math.tan(math.radians(p['fov'])/2))/(1600/900)
    cam.data.dof.focus_distance=(target-cam.location).length
    # Match the SDK's vertical FOV, with Blender's horizontal sensor fit.
    cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=36
def render(fr,out):
    state(DATA['frames'][fr]);scene.render.filepath=str(out);bpy.ops.render.render(write_still=True)
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if '--render' in args:
    for fr in range(600):
        out=BUILD/'frames'/f'{fr:04d}.png'
        if out.exists():continue
        render(fr,out)
        if fr%15==0:print('PROGRESS',fr,'/600',flush=True);(BUILD/'progress.json').write_text(json.dumps({'frame':fr,'total':600}))
else:
    for fr in [0,60,125,195,255,330,420,510,585]:render(fr,BUILD/'stills'/f'{fr:04d}.png')
print('RENDER COMPLETE',flush=True)
