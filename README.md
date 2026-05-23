# PHM-Scale-Engine
Scale selection tool for PHM
flowchart TD
```mermaid
flowchart TD

S1([Start]) --> C1

subgraph Project_Context
    C1[Design Stage] --> C2[Risk Level]
    C2 --> C3[Primary Objectives]
    C3 --> C4[Known Issues]
    C4 --> C5[Determine Qualitative Scale Band]
end

C5 --> G1

subgraph Prototype_Geometry
    G1[Spillway and Basin Length] --> G2[Upstream Extent]
    G2 --> G3[Downstream Extent]
    G3 --> G4[Width of Interest]
    G4 --> G5[Compute Total Prototype Length]
end

G5 --> H1

subgraph Hydraulics_and_Facility
    H1[Prototype Discharge] --> H2{Full Discharge Range}
    H2 --> F1[Bay Length]
    F1 --> F2[Bay Width]
    F2 --> F3[Available Flow]
end

F3 --> T1

subgraph Trial_Scale_Evaluation
    T1[Select Trial Scales] --> T2[Compute Model Geometry]
    T2 --> T3{Fits in Bay}
    T3 --> T4[Compute Model Discharge]
    T4 --> T5{Fits Flow}
    T5 --> T6[Apply Phenomena Flags]
    T6 --> T7[Store Candidate Result]
    T7 --> T8{More Trial Scales}
end

T8 -- Yes --> T2
T8 -- No --> R1

subgraph Conflict_Resolution
    R1{Any Scale Pass All Checks} 
    R1 -- Yes --> O1[Select Finest Passing Scale]
    R1 -- No --> R2{Reach Fails but Flow Passes}

    R2 -- Yes --> R2A[Reduce Extents]
    R2 --> R2B[Coarsen Scale]
    R2 --> R2C[Sectional or Compound Model]

    R2 -- No --> R3{Flow Fails but Reach Passes}

    R3 -- Yes --> R3A[Coarsen Scale]
    R3 --> R3B[Reduce Discharge Range]

    R3 -- No --> R4{Both Fail}

    R4 -- Yes --> R4A[Sectional Model]
    R4 --> R4B[Distorted Model]
    R4 --> R4C[Separate Reach and Local Models]
end

O1 --> O2[Final Recommendation]
R2A --> O3[Final Recommendation with Tradeoffs]
R2B --> O3
R2C --> O3
R3A --> O3
R3B --> O3
R4A --> O3
R4B --> O3
R4C --> O3

O2 --> END([End])
O3 --> END
```




