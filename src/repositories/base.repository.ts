import {
  Model,
  ModelStatic,
  CreationAttributes,
  WhereOptions,
  Attributes,
} from 'sequelize';

export abstract class BaseRepository<T extends Model> {
  constructor(protected readonly model: ModelStatic<T>) {}

  findById(id: string): Promise<T | null> {
    return this.model.findByPk(id);
  }

  findAll(where?: WhereOptions<Attributes<T>>): Promise<T[]> {
    return this.model.findAll({ where });
  }

  create(data: CreationAttributes<T>): Promise<T> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<Attributes<T>>): Promise<[number, T[]]> {
    // Double cast required: in the generic context Attributes<T> widens to include
    // Sequelize's Fn type, which makes a plain { id } incompatible with a single `as`.
    // `returning: true` is PostgreSQL-specific and needs the explicit cast for the overload.
    return this.model.update(data, {
      where: { id } as unknown as WhereOptions<Attributes<T>>,
      returning: true,
    }) as unknown as Promise<[number, T[]]>;
  }

  delete(id: string): Promise<number> {
    return this.model.destroy({
      where: { id } as unknown as WhereOptions<Attributes<T>>,
    });
  }
}
