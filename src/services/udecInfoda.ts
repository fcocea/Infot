import { Log } from '@/utils';

import {
  Grades,
  GradesResponse,
  RequireTwoProperties,
  UdecProps,
} from '@/types';

import * as cheerio from 'cheerio';
import { FormDataEncoder } from 'form-data-encoder';
import { FormData } from 'formdata-node';
import fs from 'fs';
import got, { HTTPError } from 'got';

class UdecInfodaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UdecInfodaError';
  }
}
export class UdecInfoda {
  private user: string;

  private pass!: string | undefined;

  private formData!: FormData;

  private cookies!: string[];

  private infodaUrl!: string;

  private succesAuth!: boolean;

  constructor({
    username,
    password,
    token,
  }: RequireTwoProperties<UdecProps, 'password', 'token'>) {
    this.user = username;
    if (!password && !token) {
      throw new UdecInfodaError('Password or token is required!');
    }
    this.pass = password;
    if (password) {
      this.formData = new FormData();
      this.formData.set('name', this.user);
      this.formData.set('pass', this.pass);
      this.formData.set('form_id', 'user_login_block');
    } else if (token) {
      this.infodaUrl = `http://app4.udec.cl/infoda2/index_sso/?pkudec=${token}`;
    }
    this.succesAuth = false;
  }

  public async login(): Promise<{
    login: boolean;
    token: string | undefined;
  }> {
    if (this.formData) {
      const encoder = new FormDataEncoder(this.formData);
      const loginRes = await got.post('https://alumnos.udec.cl/', {
        body: encoder.encode(),
        headers: encoder.headers,
        followRedirect: false,
      });
      const res = await got.get('https://alumnos.udec.cl/', {
        followRedirect: false,
        headers: {
          cookie: loginRes.headers['set-cookie'],
        },
      });
      const $ = cheerio.load(res.body);
      const infodaUrl = $('a')
        .filter((i, el) => $(el).text() === 'INFODA')
        .attr('href');
      if (infodaUrl === undefined)
        return {
          login: false,
          token: undefined,
        };
      this.cookies = loginRes.headers['set-cookie'] || [];
      this.infodaUrl = infodaUrl;
    }
    const login = await this.accesInfoda();
    return {
      login: login,
      token: this.infodaUrl.split('=')[1],
    };
  }

  private async accesInfoda(): Promise<boolean> {
    try {
      const res = await got.get(this.infodaUrl);
      this.cookies = res.headers['set-cookie'] || [];
      const $ = cheerio.load(res.body);
      const jUsername = $('input[name="j_username"]').val();
      const jPassword = $('input[name="j_password"]').val();
      const infodaPost = await got.post(
        'http://app4.udec.cl/infoda2/j_spring_security_check',
        {
          form: {
            j_username: jUsername as string,
            j_password: jPassword as string,
          },
          headers: {
            cookie: this.cookies,
          },
          followRedirect: false,
        },
      );
      this.cookies = infodaPost.headers['set-cookie'] || [];
      this.succesAuth = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRegistrationNumber(): Promise<string | undefined> {
    if (!this.succesAuth) return undefined;
    const url = 'http://app4.udec.cl/infoda2/user/carreras.json';
    try {
      const response = await got.get(url, {
        headers: {
          cookie: this.cookies,
        },
      });
      const data = JSON.parse(response.body);
      return data[0].matricula;
    } catch (error) {
      if (error instanceof HTTPError) {
        Log(
          `Error ${error.response.statusCode} - ${error.response.statusMessage} | ${this.user} | RegistrationNumber`,
        );
      }
      return undefined;
    }
  }

  async getCertificate(id: number): Promise<string | undefined> {
    if (id < 1 || id > 12) {
      Log(`Invalid certificate id (${id}) | ${this.user}`, 'error');
      return undefined;
    }
    if (!fs.existsSync('downloads')) {
      Log('Creating downloads folder...');
      fs.mkdirSync('downloads', { recursive: true });
    }
    const filename = `downloads/${this.user}-${id}.pdf`;
    const res = got.stream(
      `http://app4.udec.cl/infoda2/certificado/pdf/${id}`,
      {
        headers: {
          cookie: this.cookies,
        },
      },
    );
    res.pipe(fs.createWriteStream(filename));
    const onFinish = new Promise((resolve, reject) => {
      res.on('redirect', reject);
      res.on('end', resolve);
    });
    try {
      await onFinish;
      Log(`Certificate (${id}) downloaded successfully! | ${this.user}`);
    } catch (error) {
      Log(`Error downloading certificate (${id}) | ${this.user}`, 'error');
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      return undefined;
    }
    return filename;
  }

  async getGrades(): Promise<Grades[]> {
    const url = 'http://app4.udec.cl/infoda2/calificaciones.json';
    try {
      const response = await got.get(url, {
        headers: {
          cookie: this.cookies,
        },
      });
      const data = JSON.parse(response.body) as GradesResponse[];
      return data.map((mark: Grades) => ({
        codigoAsignatura: mark.codigoAsignatura,
        nombreAsignatura: mark.nombreAsignatura
          .toLowerCase()
          .replace(/(?:^|\s)\w/g, (letter) => letter.toUpperCase()),
        fechaCreacion: mark.fechaCreacion,
        nota: mark.nota,
        nombre: mark.nombre,
        descripcion: mark.descripcion,
      }));
    } catch (error) {
      if (error instanceof HTTPError) {
        Log(
          `Error ${error.response.statusCode} - ${error.response.statusMessage} | ${this.user} | Grades`,
        );
      }
      return [];
    }
  }
}
