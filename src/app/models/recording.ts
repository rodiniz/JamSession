export interface Paging<T> {
    pageInfo: PageInfo
    data: T[]
  }
  
  export interface PageInfo {
    currentPage: number
    perPage: number
    lastPage: number
    total: number
  }
  
  export interface Recording {
    userId: string
    roomId: string
    sessionId: string
    createdAt: string
    updatedAt: string
    fileId: string
    file: File
    id: string
  }
  
  export interface File {
    meta: Meta
    filePath: string
    size: number
    type: string
    userStorage: any
    createdAt: string
    updatedAt: string
    ratio: Ratio
    fileUrl: string
    id: string
  }
  
  export interface Meta {
    resolution: Resolution
    format: string
    duration: number
  }
  
  export interface Resolution {
    width: number
    height: number
  }
  
  export interface Ratio {
    "1080": number
  }
  