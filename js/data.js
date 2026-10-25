export const STAGES=["Prevent","Detect","Explain","Respond","Adapt","Recover","Learn"];
export const SC=[
 {id:"dos",name:"Denial of service",sub:"Control channel flooded",pD:.85,pE:.90,s:.80,cyber:true,
  twin:"Control-message latency 9x baseline on segment B; 38% of safety heartbeats late.",
  op:"The network on the packing line is overloaded, so machine commands are arriving late. This looks like an attack, not a fault.",
  an:"Flood on VLAN 20 from 14 sources; control PDUs delayed; anomaly score 0.85. Twin shows conveyor 3 torque deviation 0.4 s behind setpoint.",
  prevent:"Rate limiting caps control-channel traffic.",safe:"Switch segment B to redundant path and slow the line.",iso:"Isolate segment B from the office network.",
  recover:"Fail over to redundant link; clear flood sources; resume at full speed.",learn:"Rate limits and twin latency baseline updated.",mi:2},
 {id:"mitm",name:"Spoofed command",sub:"Man-in-the-middle on cobot link",pD:.90,pE:.70,s:.85,cyber:true,
  twin:"Cobot 2 received a speed command from an unauthenticated node; speed 3x the allowed value near a human zone.",
  op:"Cobot 2 got a command that did not come from the controller. Keep people out of its reach and hold it in position.",
  an:"Session on port 502 without mutual authentication; source MAC not in asset inventory; command rate 4x baseline. Knowledge graph links this to a known spoofing technique.",
  prevent:"Mutual authentication would block the unknown node.",safe:"Hold cobot 2 in position and revoke the unknown node.",iso:"Quarantine the unknown node's switch port.",
  recover:"Re-key cobot link; verify controller state with twin; restart cell.",learn:"Asset inventory and allow-list tightened.",mi:2},
 {id:"fdi",name:"False sensor data",sub:"Injected temperature readings",pD:.78,pE:.55,s:.90,cyber:true,
  twin:"Reactor temperature reads 61 C; the twin's thermal model says it cannot be below 78 C with the current heater duty.",
  op:"A temperature sensor is probably giving wrong numbers. Do not trust the screen for this value; the control system may heat the wrong way.",
  an:"Sensor stream well-formed and authenticated but inconsistent with twin (residual 4.1 sigma). Likely injected upstream of the gateway. Explanation confidence is low.",
  prevent:"Authentication passes; only the twin catches this.",safe:"Fall back to the redundant sensor and cap heater duty.",iso:"Isolate the compromised gateway.",
  recover:"Switch to verified sensor; recalibrate twin; re-enable gateway after inspection.",learn:"Twin residual threshold tuned for this loop.",mi:3},
 {id:"ransom",name:"Ransomware",sub:"HMI and historian encrypting",pD:.95,pE:.90,s:.70,cyber:true,
  twin:"Historian server writing encrypted files; HMI 3 unresponsive; PLC logic unchanged.",
  op:"The control screens are being locked by malware. The machines still run, but you cannot see them. Use the local panel.",
  an:"Mass file rename with high-entropy writes on historian and two HMIs; lateral movement from engineering workstation. PLC checksums intact.",
  prevent:"Segmentation limits spread to the office side.",safe:"Cut engineering workstation off and run on local panels.",iso:"Isolate the supervisory segment.",
  recover:"Restore HMIs from offline backup; rebuild historian; verify PLC logic hashes.",learn:"Backup test cadence and segmentation rules updated.",mi:0},
 {id:"ai",name:"Attack on AI model",sub:"Adversarial input to vision check",pD:.60,pE:.35,s:.75,cyber:true,
  twin:"Vision inspector passes 97% of parts, while the twin predicts 12% defects from upstream torque.",
  op:"The camera check is passing parts it should reject. Do not rely on it until a person inspects a sample.",
  an:"Model confidence is high on inputs with a small structured perturbation; drift detector silent. Explanation confidence is low; treat the model as untrusted.",
  prevent:"Robust training was not applied to this model.",safe:"Route parts to manual inspection and freeze the model.",iso:"Remove the model from the decision path.",
  recover:"Roll back to the previous model; retrain with adversarial examples.",learn:"Continuous monitoring added for confidence-versus-twin mismatch.",mi:4},
 {id:"fault",name:"Normal bearing fault",sub:"Not an attack",pD:.55,pE:.80,s:.30,cyber:false,
  twin:"Conveyor 3 vibration rising 0.2 mm/s per hour; no network anomalies, all commands authenticated.",
  op:"This is a worn bearing, not a cyberattack. Book maintenance and keep running.",
  an:"No cyber indicators. Vibration trend matches bearing-wear signature; twin explains it fully. Close as maintenance ticket.",
  prevent:"Not applicable.",safe:"Reduce speed on conveyor 3.",iso:"No isolation needed.",
  recover:"Replace bearing in the next planned stop.",learn:"Vibration threshold for this model refined.",mi:-1}
];
export const CONS=["Downtime","Safety","Product defect","Data loss","Wrong decision"];
export const CM=[[3,2,1,0,1],[2,3,2,1,3],[2,3,3,0,3],[3,1,1,3,1],[1,2,2,1,3]];
export const THR=[["Denial of Service (DDoS)","Floods the network so control messages are delayed or lost","Line stoppage; safety systems lose data","Rate limiting, anomaly detection, redundancy"],
["Man-in-the-middle / spoofing","Attacker alters or impersonates sensor and controller messages","Wrong commands reach robots or machines","Mutual authentication, encryption, zero trust"],
["False data injection","Fake sensor readings are fed to controllers","Unsafe process decisions; product defects","Digital-twin consistency checks, anomaly detection"],
["Ransomware / malware","Encrypts or disables IT and OT systems","Extended downtime and lost production","Network segmentation, backups, recovery playbooks"],
["Attack on AI models","Manipulated inputs fool ML detectors or vision systems","Missed attacks; wrong automated decisions","Robust training, explainable AI, continuous monitoring"]];
export const APPS=["Digital-twin SLR","Zero-trust twin + ledger","Twin + constrained LLM","BRIDG-ICS knowledge graph","Industry 5.0 review","Generative + XAI IDS"];
export const COV=[[1,3,1,2,1,1,1],[3,3,1,1,0,1,1],[0,3,3,1,0,0,1],[1,2,2,1,0,0,2],[2,1,0,1,1,1,1],[0,3,3,0,0,0,1]];
export const GAPS=[["Security without resilience",2.4,"Recovery and learning are rarely evaluated together with detection."],["Explainability for operators",2.6,"Few studies test whether operators can act safely on explanations."],["Human-in-the-loop security",2.8,"Humans are rarely modelled as part of defence and override decisions."],["No integrated framework",2.9,"Existing Industry 5.0 frameworks are inadequately prepared on cybersecurity."]];
export const PERS=[["Plain-language alerts",3,1],["Cyber vs fault cue",3,1],["Safe override guidance",3,1],["Cyber-machine link",2,3],["Alert triage",1,3],["Management reporting",0,3]];
export const LCOL={0:"var(--l1)",1:"var(--l2)",2:"var(--l3)",3:"var(--l4)"};
