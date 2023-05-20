export interface ConfigProps {
  BotToken: string;
  FireStore: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

type RequireProperty<T, Prop extends keyof T> = T & { [key in Prop]-?: T[key] };
export type RequireTwoProperties<
  T,
  Prop1 extends keyof T,
  Prop2 extends keyof T,
> = RequireProperty<T, Prop1> | RequireProperty<T, Prop2>;

export interface UdecProps {
  username: string;
  password?: string;
  token?: string;
}

export interface GradesResponse {
  idCurso: null;
  idCalificacion: null;
  codigoAsignatura: string;
  seccion: number;
  nombreAsignatura: string;
  userDocente: string;
  fechaCreacion: string;
  nombre: string;
  descripcion: string;
  nota: number;
  inicialesDocente: null;
  idAreaAcademica: null;
  cursoIdC: null;
  participaEn: null;
  sumNcr: null;
  sumPen: null;
  matriculaAlumno: null;
  nombreAlumno: null;
  idTipoCalificacion: null;
  indice: null;
  ponderacion: null;
  tipoEvaluacionAsignatura: null;
}

export interface User {
  id: number;
  username: string;
  token: string;
}

export interface Grades {
  codigoAsignatura: string;
  nombreAsignatura: string;
  fechaCreacion: string;
  nota: number;
  nombre: string;
  descripcion: string;
}
